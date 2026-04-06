import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function formatBot(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\$[\d,]+(\.\d{2})?/g, (m) => `<span class="price-pill">${m}</span>`)
    .replace(/\b(NOT insurance|NOT an insurance|is NOT insurance|NO es seguro)\b/gi, () => '<span class="badge-inline red">🚫 NOT Insurance</span>')
    .replace(/\bFREE\b/g, '<span class="badge-inline green">✓ FREE</span>')
    .replace(/\bEveryone qualifies\b/gi, '<span class="badge-inline green">✓ Everyone Qualifies</span>')
    .replace(/(medisavercard\.com[^\s<]*)/g, '<a href="https://$1" target="_blank">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '');
}

function getFallbackLocal(msg) {
  const t = msg.toLowerCase();
  if (/pric|cost|plan|how much|cuanto/i.test(t))
    return 'MediSaver plans: Single <span class="price-pill">$30/month</span> (first month $70) | 2 Users <span class="price-pill">$40/month</span> ($80 first) | Family up to 5 <span class="price-pill">$55/month</span> ($95 first) | Group 10+ <span class="price-pill">$20/person/month</span>. <span class="badge-inline green">✓ FREE</span> 30-day trial at medisavercard.com!';
  if (/pharmacy|farmacia|prescription/i.test(t))
    return '<span class="badge-inline green">✓ FREE</span> pharmacy card via RxLess — save 80–88% on prescriptions at 70,000+ pharmacies. Download at medisavercard.com/pharmacy-discount-card. RxLess: 1-844-479-5377.';
  if (/group|business|empresa/i.test(t))
    return 'Group plan: <span class="price-pill">$20/person/month</span> for teams of 10+. No contracts or setup fees. Includes doctor visits, labs, imaging & dental. Average savings $200–$500/person/year. Sign up: medisavercard.com/group-membership-plans';
  if (/dental|dent|tooth|muela|crown/i.test(t))
    return 'Dental: Exam <span class="badge-inline green">FREE</span> | Adult cleaning <span class="price-pill">$49</span> | Root canal anterior <span class="price-pill">$395</span> | Molar <span class="price-pill">$595</span> | Crown porcelain <span class="price-pill">$495</span> | Implant+crown <span class="price-pill">$1,950</span>.';
  if (/lab|blood|cbc|glucose/i.test(t))
    return 'Lab prices: CBC <span class="price-pill">$20</span> | Cholesterol <span class="price-pill">$7</span> | HbA1C <span class="price-pill">$9.50</span> | TSH <span class="price-pill">$14.60</span> | HIV Screen <span class="price-pill">$9.50</span> | Vitamin D <span class="price-pill">$33.50</span> | Urinalysis <span class="price-pill">$2</span>.';
  if (/mri|xray|imaging|ct scan/i.test(t))
    return 'Imaging: X-rays all <span class="price-pill">$25</span> | Ultrasounds <span class="price-pill">$50–70</span> | MRI without contrast <span class="price-pill">$275</span> | CT without contrast <span class="price-pill">$150</span> | Echo <span class="price-pill">$150</span>.';
  if (/contact|phone|call|hours/i.test(t))
    return '📞 <strong>(305) 884-8740</strong> | ✉️ info@medisavercard.com | 📍 5901 NW 151st St, Miami Lakes FL | ⏰ Mon–Fri 8:30am–5:30pm | Sat 9am–12pm | medisavercard.com';
  if (/insurance|seguro/i.test(t))
    return '<span class="badge-inline red">🚫 NOT Insurance</span> MediSaver is a Florida-licensed medical discount plan under Chapter 636 Part II. Members pay providers directly at discounted rates. MediSaver does NOT pay providers or process claims. <span class="badge-inline green">✓ Everyone Qualifies</span>';
  return 'Welcome to MediSaver! <span class="badge-inline red">🚫 NOT Insurance</span> — we are a Florida-licensed medical discount plan. Plans from <span class="price-pill">$30/month</span>, <span class="badge-inline green">✓ FREE</span> pharmacy card, 60+ providers in South Florida. <span class="badge-inline green">✓ Everyone Qualifies</span>! Try FREE 30 days at medisavercard.com or call (305) 884-8740.';
}

function getQuickReplyChips(msg) {
  const t = msg.toLowerCase();
  if (/pric|cost|plan|how much/i.test(t))
    return [
      { l: '🦷 Dental Prices', q: 'What are dental member prices?' },
      { l: '🧪 Lab Prices', q: 'What are lab test member prices?' },
      { l: '🖼 MRI Prices', q: 'What are MRI and imaging prices?' },
      { l: '💊 Pharmacy', q: 'How does the pharmacy discount card work?' },
      { l: '✅ Sign Up', q: 'How do I sign up for MediSaver?' },
    ];
  if (/doctor|provider|clinic/i.test(t))
    return [
      { l: '🫀 Cardiology', q: 'Do you have cardiologists in your network?' },
      { l: '👁 Vision', q: 'What eye doctors and optometrists are in the network?' },
      { l: '🦷 Dental', q: 'What dental providers are in the network?' },
      { l: '🦴 Orthopedics', q: 'What orthopedic doctors are available?' },
      { l: '👶 Pediatrics', q: 'What pediatricians are in the MediSaver network?' },
    ];
  if (/group|business|employee/i.test(t))
    return [
      { l: '💰 Group Pricing', q: 'What is the exact price for group membership?' },
      { l: '📋 What is included?', q: 'What services are included in the group plan?' },
      { l: '📝 How to enroll', q: 'How does the group enrollment process work?' },
      { l: '🎯 Get Quote', q: 'I want to sign up my business for the group plan' },
    ];
  return [
    { l: '💰 Pricing', q: 'What are all the membership prices?' },
    { l: '🏥 Doctors', q: 'Show me providers near Miami' },
    { l: '💊 Pharmacy', q: 'How does the free pharmacy card work?' },
    { l: '🏢 Group Plans', q: 'Tell me about group plans for business' },
    { l: '✅ Sign Up Free', q: 'How do I sign up free for 30 days?' },
    { l: '📞 Contact', q: 'What is the phone number and hours?' },
  ];
}

const DEFAULT_CHIPS = [
  { l: '💰 Pricing', q: 'What are all membership prices?' },
  { l: '🏥 Find Doctors', q: 'Show me doctors near me' },
  { l: '💊 Pharmacy', q: 'How does pharmacy card work?' },
  { l: '🏢 Group Plans', q: 'Tell me about group plans' },
  { l: '🧪 Lab Prices', q: 'What are lab test prices for members?' },
  { l: '✅ Sign Up', q: null, href: 'https://medisavercard.com/register' },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE}${path}`;

export default function App() {
  const sessionId = useMemo(
    () => `ms_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`,
    []
  );

  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('auto');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [welcomeMode, setWelcomeMode] = useState('full');
  const [escalation, setEscalation] = useState(false);
  const [quickChips, setQuickChips] = useState(DEFAULT_CHIPS);
  const [inputValue, setInputValue] = useState('');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);

  const [lfTitle, setLfTitle] = useState('🎯 Get a Free Consultation');
  const [lfSub, setLfSub] = useState('Our MediSaver team will reach out within 1 business hour.');
  const [lfName, setLfName] = useState('');
  const [lfType, setLfType] = useState('individual');
  const [lfEmail, setLfEmail] = useState('');
  const [lfPhone, setLfPhone] = useState('');
  const [lfNotes, setLfNotes] = useState('');
  const [lfSubmitting, setLfSubmitting] = useState(false);

  const [toasts, setToasts] = useState([]);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  const narrow = winW <= 640;
  const sidebarCollapsed = narrow ? !mobileSidebarOpen : desktopSidebarCollapsed;
  const sidebarMobileOpenClass = narrow && mobileSidebarOpen;

  const placeholder =
    {
      en: 'Ask about MediSaver plans, providers, or pricing…',
      es: 'Pregunta sobre planes, proveedores o precios…',
      fr: 'Question sur MediSaver…',
      pt: 'Pergunte sobre o MediSaver…',
    }[lang] || 'Ask about MediSaver…';

  const showToast = useCallback((msg, type = '') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 640) {
      setMobileSidebarOpen(false);
    } else {
      setDesktopSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (!narrow) setMobileSidebarOpen(false);
  }, [narrow]);

  useEffect(() => {
    const onResize = () => {
      setWinW(window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!voiceModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setVoiceModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voiceModalOpen]);

  useEffect(() => {
    if (!narrow || !mobileSidebarOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [narrow, mobileSidebarOpen]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, welcomeMode]);

  const appendMsg = useCallback((role, content) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((m) => [...m, { id: `${Date.now()}_${Math.random()}`, role, content, time }]);
  }, []);

  const sendMessage = useCallback(
    async (override) => {
      const text = (override ?? inputValue).trim();
      if (!text || isTyping) return;

      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setWelcomeMode('none');

      appendMsg('user', text);
      setHistory((h) => [...h, { role: 'user', content: text }]);
      setMsgCount((c) => c + 1);

      setIsTyping(true);
      const histAfterUser = [...history, { role: 'user', content: text }];
      const nextMsgCount = msgCount + 1;

      try {
        const r = await fetch(apiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            sessionId,
            conversationHistory: histAfterUser.slice(-14),
            leadInfo: {},
          }),
        });
        const d = await r.json();
        setIsTyping(false);
        if (!r.ok) throw new Error(d.error || 'Error');

        const reply = d.response || 'Please call (305) 884-8740 for help.';
        appendMsg('bot', reply);
        setHistory((h) => [...h, { role: 'assistant', content: reply }]);

        if (d.lang && lang === 'auto') setLang(d.lang);
        if (d.shouldEscalate) setEscalation(true);
        if (d.needsLeadCapture && nextMsgCount > 2 && !leadCaptured) {
          setTimeout(() => {
            setLfTitle('🎯 Get a Free Consultation');
            setLfSub('Our MediSaver team will reach out within 1 business hour.');
            setLeadOpen(true);
            setOverlayActive(true);
          }, 1800);
        }
        setQuickChips(
          getQuickReplyChips(text).map((c) => ({ l: c.l, q: c.q, href: null }))
        );
      } catch {
        setIsTyping(false);
        appendMsg('bot', getFallbackLocal(text));
      }
    },
    [inputValue, isTyping, history, sessionId, lang, msgCount, leadCaptured, appendMsg]
  );

  const quickSend = useCallback(
    (text) => {
      setInputValue('');
      if (narrow) setMobileSidebarOpen(false);
      sendMessage(text);
    },
    [sendMessage, narrow]
  );

  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    const ta = e.target;
    setInputValue(ta.value);
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  };

  const clearInput = () => {
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const clearChat = () => {
    setHistory([]);
    setMessages([]);
    setMsgCount(0);
    setWelcomeMode('cleared');
    setEscalation(false);
    showToast('Chat cleared', 'success');
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 640) {
      setMobileSidebarOpen((v) => !v);
    } else {
      setDesktopSidebarCollapsed((c) => !c);
    }
  };

  const setLangChoice = (l) => {
    if (narrow) setMobileSidebarOpen(false);
    setLang(l);
    const msgs = {
      es: 'Hola! Ahora podemos hablar en español. ¿En qué le puedo ayudar con MediSaver hoy?',
      fr: 'Bonjour! Nous pouvons maintenant discuter en français. Comment puis-je vous aider?',
      pt: 'Olá! Agora podemos conversar em português. Como posso ajudar com o MediSaver?',
    };
    if (msgs[l]) {
      setWelcomeMode('none');
      appendMsg('bot', msgs[l]);
    }
    showToast(`Language set to ${l.toUpperCase()}`, 'success');
  };

  const openLead = (type) => {
    if (leadOpen) return;
    if (narrow) setMobileSidebarOpen(false);
    setLeadOpen(true);
    setOverlayActive(true);
    if (type === 'group') {
      setLfTitle('🏢 Group Plan — Get a Quote');
      setLfSub("Tell us about your business and we'll set up your group plan quickly.");
      setLfType('group');
    } else {
      setLfTitle('🎯 Get a Free Consultation');
      setLfSub('Our MediSaver team will reach out within 1 business hour.');
    }
  };

  const closeLead = () => {
    setLeadOpen(false);
    if (!analyticsOpen) setOverlayActive(false);
  };

  const openAnalytics = () => {
    setAnalyticsOpen(true);
    setOverlayActive(true);
    setAnalyticsData(null);
    setAnalyticsError(false);
    fetch(apiUrl('/api/analytics'))
      .then((r) => r.json())
      .then((d) => setAnalyticsData(d))
      .catch(() => {
        setAnalyticsError(true);
        setAnalyticsData(null);
      });
  };

  const closeAnalytics = () => {
    setAnalyticsOpen(false);
    if (!leadOpen) setOverlayActive(false);
  };

  const closeAll = () => {
    closeLead();
    closeAnalytics();
  };

  const submitLead = async () => {
    const name = lfName.trim();
    const email = lfEmail.trim();
    const phone = lfPhone.trim();
    const type = lfType;
    const notes = lfNotes.trim();
    if (!email && !phone) {
      showToast('Please provide email or phone', 'error');
      return;
    }
    setLfSubmitting(true);
    try {
      await fetch(apiUrl('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          type,
          notes,
          sessionId,
          lang,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      /* ignore */
    }
    setLeadCaptured(true);
    setLeadOpen(false);
    if (!analyticsOpen) setOverlayActive(false);
    setLfSubmitting(false);
    setWelcomeMode('none');
    const msg =
      lang === 'es'
        ? `✅ <strong>¡Gracias${name ? `, ${name}` : ''}!</strong> Sus datos han sido registrados. Nuestro equipo le contactará pronto.<br><br>📞 <strong>(305) 884-8740</strong><br>✉️ info@medisavercard.com<br>⏰ Lun–Vie 8:30am–5:30pm`
        : `✅ <strong>Thank you${name ? `, ${name}` : ''}!</strong> Your information has been received. A MediSaver representative will reach out shortly.<br><br>📞 <strong>(305) 884-8740</strong><br>✉️ info@medisavercard.com<br>⏰ Mon–Fri 8:30am–5:30pm`;
    appendMsg('bot', msg);
    showToast('Information submitted!', 'success');
  };

  const maxIntent = analyticsData?.topIntents?.[0]?.[1] || 1;

  return (
    <>
      <div
        className={`overlay${overlayActive ? ' active' : ''}`}
        id="overlay"
        onClick={closeAll}
        role="presentation"
      />
      <div className="toast-wrap" id="toastWrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.msg}
          </div>
        ))}
      </div>

      <div className={`lead-overlay${leadOpen ? ' show' : ''}`} id="leadOverlay">
        <div className="lead-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="lf-header">
            <span className="lf-title" id="lfTitle">
              {lfTitle}
            </span>
            <button type="button" className="lf-close" onClick={closeLead}>
              ✕
            </button>
          </div>
          <p className="lf-sub" id="lfSub">
            {lfSub}
          </p>
          <div className="lf-grid">
            <div className="lf-field">
              <label className="lf-label" htmlFor="lfName">
                Full Name
              </label>
              <input
                className="lf-input"
                id="lfName"
                type="text"
                placeholder="Your name"
                value={lfName}
                onChange={(e) => setLfName(e.target.value)}
              />
            </div>
            <div className="lf-field">
              <label className="lf-label" htmlFor="lfType">
                Plan Type
              </label>
              <select
                className="lf-input"
                id="lfType"
                value={lfType}
                onChange={(e) => setLfType(e.target.value)}
              >
                <option value="individual">Individual</option>
                <option value="family">Family</option>
                <option value="group">Group / Business</option>
                <option value="provider">I&apos;m a Provider</option>
              </select>
            </div>
            <div className="lf-field">
              <label className="lf-label" htmlFor="lfEmail">
                Email Address
              </label>
              <input
                className="lf-input"
                id="lfEmail"
                type="email"
                placeholder="email@example.com"
                value={lfEmail}
                onChange={(e) => setLfEmail(e.target.value)}
              />
            </div>
            <div className="lf-field">
              <label className="lf-label" htmlFor="lfPhone">
                Phone Number
              </label>
              <input
                className="lf-input"
                id="lfPhone"
                type="tel"
                placeholder="(305) 000-0000"
                value={lfPhone}
                onChange={(e) => setLfPhone(e.target.value)}
              />
            </div>
            <div className="lf-field full">
              <label className="lf-label" htmlFor="lfNotes">
                Notes / Questions
              </label>
              <textarea
                className="lf-input"
                id="lfNotes"
                rows={2}
                placeholder="Any specific needs or questions?"
                value={lfNotes}
                onChange={(e) => setLfNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="lf-btns">
            <button type="button" className="lf-cancel" onClick={closeLead}>
              Cancel
            </button>
            <button
              type="button"
              className="lf-submit"
              id="lfSubmit"
              onClick={submitLead}
              disabled={lfSubmitting}
            >
              {lfSubmitting ? 'Sending…' : '📩 Send My Info'}
            </button>
          </div>
        </div>
      </div>

      <div className={`analytics-panel${analyticsOpen ? ' open' : ''}`} id="analyticsPanel">
        <div className="ap-header">
          <span className="ap-title">📊 Conversation Analytics</span>
          <button type="button" className="ap-close" onClick={closeAnalytics}>
            ✕
          </button>
        </div>
        <div className="ap-body" id="analyticsBody">
          {analyticsError && (
            <div className="no-data">
              <span>🔌</span>
              Server not connected.
              <br />
              Run: node backend/server.js
            </div>
          )}
          {!analyticsError && !analyticsData && (
            <div className="no-data">
              <span>📊</span>
              Loading analytics…
            </div>
          )}
          {!analyticsError && analyticsData && (
            <>
              <div>
                <div className="ap-section-title">Key Metrics</div>
                <div className="ap-kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-val">{analyticsData.totalMessages || 0}</div>
                    <div className="kpi-lbl">Messages</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-val">{analyticsData.totalSessions || 0}</div>
                    <div className="kpi-lbl">Sessions</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-val">{analyticsData.totalLeads || 0}</div>
                    <div className="kpi-lbl">Leads</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-val">{analyticsData.conversations?.length || 0}</div>
                    <div className="kpi-lbl">Convos</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="ap-section-title">Top Intents</div>
                {(analyticsData.topIntents || []).length === 0 ? (
                  <div className="no-data">
                    <span>💬</span>No data yet. Start chatting!
                  </div>
                ) : (
                  (analyticsData.topIntents || []).map(([k, v]) => (
                    <div key={k} className="intent-bar">
                      <div className="intent-label">{k.replace(/_/g, ' ')}</div>
                      <div className="intent-track">
                        <div
                          className="intent-fill"
                          style={{ width: `${Math.round((v / maxIntent) * 100)}%` }}
                        />
                      </div>
                      <div className="intent-count">{v}</div>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div className="ap-section-title">
                  Recent Leads ({analyticsData.totalLeads || 0})
                </div>
                {(analyticsData.recentLeads || []).length === 0 ? (
                  <div className="no-data">
                    <span>👥</span>No leads yet.
                  </div>
                ) : (
                  (analyticsData.recentLeads || []).map((l) => (
                    <div key={`${l.timestamp}-${l.email}`} className="lead-card-a">
                      <div>
                        <div className="lead-info">{l.name || 'Unknown'}</div>
                        <div className="lead-meta-a">
                          {l.email || ''}
                          {l.phone ? ` · ${l.phone}` : ''}
                        </div>
                        <div className="lead-meta-a">
                          {l.timestamp ? new Date(l.timestamp).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <span className="lead-type">{l.type || 'individual'}</span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div className="ap-section-title">Export</div>
                <button
                  type="button"
                  className="export-btn"
                  onClick={() => window.open(apiUrl('/api/leads/export'), '_blank')}
                >
                  ⬇ Export Leads as CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="app">
        <aside
          className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${sidebarMobileOpenClass ? ' mobile-open' : ''}`}
          id="sidebar"
        >
          <div className="sb-logo">
            {narrow && (
              <button
                type="button"
                className="sidebar-close-btn"
                aria-label="Close menu"
                onClick={() => setMobileSidebarOpen(false)}
              >
                ✕
              </button>
            )}
            <div className="logo-row">
              <div className="logo-icon"><img src="/logo.jpeg" alt="MediSaver" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
              <div className="logo-text">
                <span className="logo-name">MediSaver</span>
                <span className="logo-sub">Medical Discount</span>
              </div>
            </div>
            <div className="online-badge">
              <div className="online-dot" />
              AI Advisor Online
            </div>
          </div>

          <div className="sb-scroll">
            <div className="sb-section-label" style={{ marginTop: '8px' }}>
              Platform Overview
            </div>
            <div className="stats-grid" style={{ marginBottom: '16px' }}>
              <div className="stat-card">
                <div className="stat-val">60+</div>
                <div className="stat-lbl">Providers</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">80%</div>
                <div className="stat-lbl">Max Savings</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">3</div>
                <div className="stat-lbl">Counties</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">FREE</div>
                <div className="stat-lbl">Pharmacy Card</div>
              </div>
            </div>

            <div className="sb-section-label">Quick Topics</div>
            <div className="quick-actions">
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What is MediSaver and how does it work?')}
              >
                <span className="qa-icon">❓</span>
                <span className="qa-label">What is MediSaver?</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What are the membership pricing plans?')}
              >
                <span className="qa-icon">💰</span>
                <span className="qa-label">Plans & Pricing</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('Show me doctors and providers near Miami')}
              >
                <span className="qa-icon">🏥</span>
                <span className="qa-label">Find Doctors</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('How does the free pharmacy discount card work?')}
              >
                <span className="qa-icon">💊</span>
                <span className="qa-label">Pharmacy Card</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('Tell me about group membership for my business')}
              >
                <span className="qa-icon">🏢</span>
                <span className="qa-label">Group Plans</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What are the member prices for lab tests?')}
              >
                <span className="qa-icon">🧪</span>
                <span className="qa-label">Lab Prices</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What are dental member prices?')}
              >
                <span className="qa-icon">🦷</span>
                <span className="qa-label">Dental Prices</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What are MRI and CT scan member prices?')}
              >
                <span className="qa-icon">🖼</span>
                <span className="qa-label">Imaging / MRI</span>
                <span className="qa-arrow">›</span>
              </button>
              <button type="button" className="qa-btn" onClick={() => quickSend('Is MediSaver insurance?')}>
                <span className="qa-icon">🚫</span>
                <span className="qa-label">Is it Insurance?</span>
                <span className="qa-arrow">›</span>
              </button>
              <button type="button" className="qa-btn" onClick={() => quickSend('How do I sign up and try it free?')}>
                <span className="qa-icon">✅</span>
                <span className="qa-label">Sign Up Free</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('I am a doctor and want to become a provider')}
              >
                <span className="qa-icon">👨‍⚕️</span>
                <span className="qa-label">Become Provider</span>
                <span className="qa-arrow">›</span>
              </button>
              <button
                type="button"
                className="qa-btn"
                onClick={() => quickSend('What is the contact information and hours?')}
              >
                <span className="qa-icon">📞</span>
                <span className="qa-label">Contact Us</span>
                <span className="qa-arrow">›</span>
              </button>
            </div>

            <div className="sb-section-label" style={{ marginTop: '8px' }}>
              Membership Plans
            </div>
            <div className="plan-list">
              <div
                className="plan-item"
                onClick={() => quickSend('Tell me about the Single User membership plan at $30 per month')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && quickSend('Tell me about the Single User membership plan at $30 per month')}
              >
                <span className="plan-name">Single User</span>
                <span className="plan-price">$30/mo</span>
              </div>
              <div
                className="plan-item"
                onClick={() => quickSend('Tell me about the 2 users membership plan at $40 per month')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && quickSend('Tell me about the 2 users membership plan at $40 per month')
                }
              >
                <span className="plan-name">2 Users</span>
                <span className="plan-price">$40/mo</span>
              </div>
              <div
                className="plan-item"
                onClick={() =>
                  quickSend(
                    'Tell me about the family membership plan at $55 per month for up to 5 members'
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  quickSend('Tell me about the family membership plan at $55 per month for up to 5 members')
                }
              >
                <span className="plan-name">Family (up to 5)</span>
                <span className="plan-price">$55/mo</span>
              </div>
              <div
                className="plan-item"
                onClick={() => openLead('group')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openLead('group')}
              >
                <span className="plan-name">Group / Business</span>
                <span className="plan-price">$20/person</span>
              </div>
            </div>

            <div className="sb-section-label" style={{ marginTop: '12px' }}>
              Language / Idioma
            </div>
            <div className="plan-list">
              <div className="plan-item" onClick={() => setLangChoice('en')} role="button" tabIndex={0}>
                <span className="plan-name">🇺🇸 English</span>
              </div>
              <div className="plan-item" onClick={() => setLangChoice('es')} role="button" tabIndex={0}>
                <span className="plan-name">🇪🇸 Español</span>
              </div>
              <div className="plan-item" onClick={() => setLangChoice('fr')} role="button" tabIndex={0}>
                <span className="plan-name">🇫🇷 Français</span>
              </div>
              <div className="plan-item" onClick={() => setLangChoice('pt')} role="button" tabIndex={0}>
                <span className="plan-name">🇧🇷 Português</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <header className="header">
            <button
              type="button"
              className="header-toggle"
              onClick={toggleSidebar}
              title="Menu"
              aria-label={mobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={narrow ? mobileSidebarOpen : undefined}
            >
              ☰
            </button>
            {welcomeMode === 'none' && (
              <button type="button" className="back-home-btn" onClick={() => setWelcomeMode('full')} title="Back to home">
                ← Home
              </button>
            )}
            <div className="header-info">
              <div className="header-title">MediSaver Medical Discount Plan</div>
              <div className="header-sub">
                English &amp; Español (text) · AI detects your language · (305) 884-8740 · medisavercard.com
              </div>
            </div>
            <div className="header-actions">
              <button type="button" className="hdr-btn hdr-btn-ghost" onClick={clearChat}>
                Clear Chat
              </button>
              <button type="button" className="hdr-btn hdr-btn-ghost" onClick={openAnalytics}>
                📊 Analytics
              </button>
              <button type="button" className="hdr-btn hdr-btn-ghost" onClick={() => openLead()}>
                🎯 Get Consult
              </button>
              <button
                type="button"
                className="hdr-btn hdr-btn-primary"
                onClick={() => window.open('https://medisavercard.com/register', '_blank')}
              >
                Sign Up Today ↗
              </button>
            </div>
          </header>

          <div className="messages" id="messagesArea" ref={messagesRef}>
            {welcomeMode === 'full' && (
              <div className="welcome" id="welcomeScreen">
                <div className="welcome-avatar">
                  <img src="/logo.jpeg" alt="MediSaver" width={96} height={96} decoding="async" />
                </div>
                <h1 className="welcome-title">
                  MediSaver <em>AI Assistant</em>
                </h1>
                <p className="welcome-tagline">Medical discount plan help for medisavercard.com</p>
                <p className="welcome-sub">
                  Get instant answers about MediSaver — Florida&apos;s trusted medical discount plan. Save up to 80% on
                  doctor visits, labs, dental, imaging, and prescriptions. Ask in <strong>English</strong> or{' '}
                  <strong>Español</strong> (or any language); the AI responds in the language you use.
                </p>
                {messages.length > 0 && (
                  <button type="button" className="continue-convo-btn" onClick={() => setWelcomeMode('none')}>
                    💬 Continue Conversation →
                  </button>
                )}
                <div className="welcome-badges">
                  <span
                    className="badge badge-red"
                    style={{ background: '#fadbd8', color: '#922b21', borderColor: '#f1948a' }}
                  >
                    🚫 NOT Insurance
                  </span>
                  <span className="badge badge-green">✓ Everyone Qualifies</span>
                  <span className="badge badge-teal">✓ FREE 30-Day Trial</span>
                  <span className="badge badge-gold">💊 FREE Pharmacy Card</span>
                  <span className="badge badge-navy">🌍 Multilingual</span>
                </div>
                <div className="suggestion-grid">
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() => quickSend('What is MediSaver and how does it work?')}
                  >
                    <span className="sugg-icon">❓</span>
                    <span className="sugg-label">What is MediSaver?</span>
                    <span className="sugg-desc">Learn about our medical discount plan</span>
                  </button>
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() => quickSend('What are all the membership plans and prices?')}
                  >
                    <span className="sugg-icon">💰</span>
                    <span className="sugg-label">Plans & Pricing</span>
                    <span className="sugg-desc">From $30/month, family & group options</span>
                  </button>
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() => quickSend('Show me doctors and medical providers near Miami Hialeah Doral')}
                  >
                    <span className="sugg-icon">🏥</span>
                    <span className="sugg-label">Find Doctors</span>
                    <span className="sugg-desc">60+ providers across South Florida</span>
                  </button>
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() =>
                      quickSend('How does the free pharmacy discount card work and where can I use it?')
                    }
                  >
                    <span className="sugg-icon">💊</span>
                    <span className="sugg-label">Free Pharmacy Card</span>
                    <span className="sugg-desc">Save 80–88% on prescriptions</span>
                  </button>
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() => quickSend('Tell me about group membership plans for my business employees')}
                  >
                    <span className="sugg-icon">🏢</span>
                    <span className="sugg-label">Business Group Plans</span>
                    <span className="sugg-desc">$20/person/month for teams of 10+</span>
                  </button>
                  <button
                    type="button"
                    className="sugg-card"
                    onClick={() => quickSend('What are the member prices for dental, MRI, labs and X-rays?')}
                  >
                    <span className="sugg-icon">📋</span>
                    <span className="sugg-label">Member Price List</span>
                    <span className="sugg-desc">Exact prices for all services</span>
                  </button>
                </div>
              </div>
            )}
            {welcomeMode === 'cleared' && (
              <div className="welcome" id="welcomeScreen">
                <div className="welcome-avatar">
                  <img src="/logo.jpeg" alt="MediSaver" width={96} height={96} decoding="async" />
                </div>
                <h1 className="welcome-title">
                  Chat <em>Cleared</em>
                </h1>
                <p className="welcome-sub">Ready to help you again. Ask me anything about MediSaver!</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg-row${m.role === 'bot' ? '' : ' user'}`}>
                <div className={`msg-av ${m.role === 'bot' ? 'bot' : 'usr'}`}>{m.role === 'bot' ? <img src="/logo.jpeg" alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} /> : '👤'}</div>
                <div className="msg-body">
                  {m.role === 'bot' ? (
                    <div
                      className="bubble bot"
                      dangerouslySetInnerHTML={{ __html: formatBot(m.content) }}
                    />
                  ) : (
                    <div className="bubble user">{m.content}</div>
                  )}
                  <div className="msg-time">{m.time}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="typing-row">
                <div className="msg-av bot"><img src="/logo.jpeg" alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} /></div>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div id="esc-banner" className={escalation ? 'show' : ''}>
            <div className="esc-title">🙋 Connect with our team directly</div>
            <div>Our MediSaver representatives are available to help you right now.</div>
            <div className="esc-btns">
              <button type="button" className="esc-btn esc-call" onClick={() => window.open('tel:3058848740')}>
                📞 (305) 884-8740
              </button>
              <button
                type="button"
                className="esc-btn esc-email"
                onClick={() => window.open('mailto:info@medisavercard.com')}
              >
                ✉️ Email Us
              </button>
            </div>
          </div>

          <div className="quick-replies quick-replies-above-input" id="quickReplies">
            {quickChips.map((c, i) =>
              c.href ? (
                <button
                  key={`${c.l}-${i}`}
                  type="button"
                  className="qr-chip"
                  onClick={() => window.open(c.href, '_blank')}
                >
                  {c.l}
                </button>
              ) : (
                <button key={`${c.l}-${i}`} type="button" className="qr-chip" onClick={() => quickSend(c.q)}>
                  {c.l}
                </button>
              )
            )}
          </div>

          <div className="input-wrap input-wrap-bottom" id="chatComposer">
            <div className="input-box" id="inputBox">
              <textarea
                ref={textareaRef}
                className="input-ta"
                id="msgInput"
                placeholder={placeholder}
                rows={1}
                maxLength={2000}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeydown}
                disabled={isTyping}
                aria-label="Message MediSaver AI"
              />
              <div className="input-actions">
                <button
                  type="button"
                  className="voice-btn"
                  title="Voice (coming soon)"
                  aria-label="Voice input coming soon"
                  onClick={() => setVoiceModalOpen(true)}
                >
                  <span className="voice-btn-icon" aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </span>
                </button>
                <button type="button" className="clear-btn" onClick={clearInput} title="Clear">
                  ✕
                </button>
                <button type="button" className="send-btn" id="sendBtn" onClick={() => sendMessage()} title="Send" disabled={isTyping}>
                  ➤
                </button>
              </div>
            </div>
          </div>
        </main>

        {narrow && mobileSidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </div>

      <div
        className={`voice-soon-overlay${voiceModalOpen ? ' show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-soon-title"
        onClick={() => setVoiceModalOpen(false)}
      >
        <div className="voice-soon-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="voice-soon-close" onClick={() => setVoiceModalOpen(false)} aria-label="Close">
            ✕
          </button>
          <div className="voice-soon-icon" aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h2 id="voice-soon-title" className="voice-soon-title">
            Voice input — coming soon
          </h2>
          <p className="voice-soon-text">
            We&apos;re building hands-free <strong>English</strong> and <strong>Spanish</strong> voice support for MediSaver.
            For now, type your question in the chat bar — the assistant already understands and replies in Español and other languages.
          </p>
          <div className="voice-soon-badges">
            <span className="vs-badge">🎙️ Voice — roadmap</span>
            <span className="vs-badge">✍️ Text — live now</span>
          </div>
          <button type="button" className="voice-soon-ok" onClick={() => setVoiceModalOpen(false)}>
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
