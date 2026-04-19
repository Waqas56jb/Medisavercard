/**
 * MediSaver Voice Agent
 * Uses OpenAI GPT-4o Realtime API via WebRTC + ephemeral token.
 * Architecture:
 *   1. POST /api/realtime-token  → backend creates a short-lived token
 *   2. Browser opens RTCPeerConnection directly to OpenAI using that token
 *   3. Microphone audio streams to OpenAI; AI audio plays back natively
 *   4. DataChannel carries event messages (transcripts, status, errors)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

export function VoiceAgent({ onClose }) {
  /* ─── state ─── */
  const [status, setStatus]           = useState('connecting'); // connecting|ready|listening|speaking|error
  const [transcript, setTranscript]   = useState([]);           // [{role:'user'|'assistant', text}]
  const [streamingText, setStreaming] = useState('');           // AI text currently streaming
  const [errorMsg, setErrorMsg]       = useState('');

  /* ─── refs (not re-render-critical) ─── */
  const pcRef           = useRef(null);  // RTCPeerConnection
  const dcRef           = useRef(null);  // DataChannel
  const audioElRef      = useRef(null);  // <audio> element for AI voice playback
  const streamRef       = useRef(null);  // microphone MediaStream
  const transcriptEnd   = useRef(null);  // scroll anchor
  const aiTextBuf       = useRef('');    // accumulates streaming AI transcript

  /* ─── cleanup & stop ─── */
  const stop = useCallback(() => {
    try { dcRef.current?.close(); } catch (_) {}
    try { pcRef.current?.close(); } catch (_) {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    onClose();
  }, [onClose]);

  /* ─── realtime event handler ─── */
  function handleEvent(ev) {
    switch (ev.type) {
      /* User started speaking */
      case 'input_audio_buffer.speech_started':
        setStatus('listening');
        break;

      /* User stopped — AI about to respond */
      case 'input_audio_buffer.speech_stopped':
        setStatus('speaking');
        break;

      /* New AI response starting */
      case 'response.created':
        setStatus('speaking');
        aiTextBuf.current = '';
        setStreaming('');
        break;

      /* AI audio transcript streaming in real-time */
      case 'response.audio_transcript.delta':
        aiTextBuf.current += ev.delta || '';
        setStreaming(aiTextBuf.current);
        break;

      /* AI finished one response */
      case 'response.audio_transcript.done':
        if (aiTextBuf.current.trim()) {
          setTranscript(prev => [...prev, { role: 'assistant', text: aiTextBuf.current.trim() }]);
        }
        aiTextBuf.current = '';
        setStreaming('');
        setStatus('ready');
        break;

      /* User speech transcription completed */
      case 'conversation.item.input_audio_transcription.completed':
        if (ev.transcript?.trim()) {
          setTranscript(prev => [...prev, { role: 'user', text: ev.transcript.trim() }]);
        }
        break;

      /* Rate limit / error from OpenAI */
      case 'error':
        console.error('[VoiceAgent] Realtime error:', ev.error);
        setStatus('error');
        setErrorMsg(ev.error?.message || 'An error occurred. Please try again.');
        break;

      default:
        break;
    }
  }

  /* ─── init: token → mic → WebRTC → OpenAI ─── */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        /* 1. Fetch ephemeral token from our backend (API key stays on server) */
        const tokenRes = await fetch(`${API_BASE}/api/realtime-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!tokenRes.ok) throw new Error('Unable to start voice session. Please try again.');
        const { token } = await tokenRes.json();
        if (cancelled) return;

        /* 2. Request microphone access with optimal settings for speech */
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000
          }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        /* 3. Create RTCPeerConnection */
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        /* 4. Audio output — plays the AI's voice through speakers */
        const audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;
        pc.ontrack = (e) => {
          if (audioEl.srcObject !== e.streams[0]) {
            audioEl.srcObject = e.streams[0];
          }
        };

        /* 5. Add microphone audio track to the peer connection */
        stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

        /* 6. Data channel carries all signaling events */
        const dc = pc.createDataChannel('oai-events');
        dcRef.current = dc;

        dc.onopen = () => {
          if (cancelled) return;
          setStatus('ready');
          /* Trigger the AI to deliver its opening greeting immediately */
          dc.send(JSON.stringify({ type: 'response.create' }));
        };

        dc.onmessage = (e) => {
          if (cancelled) return;
          try { handleEvent(JSON.parse(e.data)); } catch (_) {}
        };

        dc.onerror = () => {
          if (!cancelled) {
            setStatus('error');
            setErrorMsg('Voice connection lost. Please close and try again.');
          }
        };

        dc.onclose = () => {
          if (!cancelled && status !== 'error') {
            setStatus('error');
            setErrorMsg('Session ended. Please restart.');
          }
        };

        /* 7. SDP offer → send to OpenAI → get answer → set remote description */
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpRes = await fetch(
          `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/sdp'
            },
            body: offer.sdp
          }
        );

        if (!sdpRes.ok) {
          const errText = await sdpRes.text();
          throw new Error(`OpenAI connection refused: ${errText.slice(0, 120)}`);
        }

        const sdpAnswer = await sdpRes.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
        /* ✅ WebRTC is now established — audio flows both ways */

      } catch (err) {
        if (cancelled) return;
        console.error('[VoiceAgent] Init error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Could not start voice session.');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── auto-scroll transcript ─── */
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, streamingText]);

  /* ─── derived flags ─── */
  const isConnecting = status === 'connecting';
  const isListening  = status === 'listening' || status === 'ready';
  const isSpeaking   = status === 'speaking';
  const isError      = status === 'error';

  const statusLabel = {
    connecting: 'Connecting...',
    ready:      'Listening...',
    listening:  'Listening...',
    speaking:   'Speaking...',
    error:      'Error'
  }[status];

  const subtitleText = isConnecting
    ? 'Starting secure voice session...'
    : isSpeaking
    ? 'MediSaver AI is speaking...'
    : isError
    ? 'Something went wrong'
    : 'Speak naturally — ask anything about MediSaver';

  /* ─── render ─── */
  return createPortal(
    <div className="voice-overlay" role="dialog" aria-modal="true" aria-label="Voice agent active">
      {/* Blurred chatbot behind the overlay */}
      <div className="voice-overlay__backdrop" />

      <div className="voice-overlay__card">

        {/* Status badge */}
        <div className={`vor-status vor-status--${status}`} role="status" aria-live="polite">
          <span className="vor-status__dot" aria-hidden />
          <span className="vor-status__label">{statusLabel}</span>
        </div>

        <p className="voice-overlay__sub">{subtitleText}</p>

        {/* Mic circle with expanding rings */}
        <div className="voice-overlay__rings-wrap" aria-hidden>
          {isListening && (
            <>
              <span className="vor-ring vor-ring--1" />
              <span className="vor-ring vor-ring--2" />
              <span className="vor-ring vor-ring--3" />
              <span className="vor-ring vor-ring--4" />
            </>
          )}
          <div className={`voice-overlay__mic-circle${isSpeaking ? ' vmc--speaking' : ''}`}>
            {isConnecting ? (
              <span className="vor-spinner" aria-label="Connecting..." />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="voice-overlay__mic-svg" aria-hidden>
                <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
                <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Equalizer wave — visible only while AI is speaking */}
        {isSpeaking && (
          <div className="voice-overlay__wave" aria-hidden>
            {[1,2,3,4,5,6,7].map(i => (
              <span key={i} className={`vow-bar vow-bar--${i}`} />
            ))}
          </div>
        )}

        {/* Scrollable conversation transcript */}
        {(transcript.length > 0 || streamingText) && (
          <div className="vor-transcript" role="log" aria-live="polite" aria-label="Conversation transcript">
            {transcript.map((item, i) => (
              <div key={i} className={`vor-msg vor-msg--${item.role}`}>
                <span className="vor-msg__name">
                  {item.role === 'user' ? '👤 You' : '🩺 MediSaver AI'}
                </span>
                <p className="vor-msg__text">{item.text}</p>
              </div>
            ))}

            {/* Streaming AI response — shown token-by-token as GPT responds */}
            {streamingText && (
              <div className="vor-msg vor-msg--assistant vor-msg--live">
                <span className="vor-msg__name">🩺 MediSaver AI</span>
                <p className="vor-msg__text">
                  {streamingText}
                  <span className="vor-cursor" aria-hidden>▌</span>
                </p>
              </div>
            )}

            <div ref={transcriptEnd} />
          </div>
        )}

        {/* Error message */}
        {isError && (
          <p className="vor-error-msg" role="alert">{errorMsg}</p>
        )}

        {/* End session button */}
        <button
          type="button"
          className="voice-overlay__stop-btn"
          onClick={stop}
          aria-label="End voice session"
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
          End Session
        </button>

      </div>
    </div>,
    document.body
  );
}
