require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const OPENAI_KEY = process.env.OPENAI_API_KEY;
console.log("Key length:", OPENAI_KEY ? OPENAI_KEY.length : 0);

fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
    })
})
.then(r => r.json())
.then(data => {
    console.log(JSON.stringify(data, null, 2));
})
.catch(console.error);
