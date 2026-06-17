export default async function handler(request, response) {
  // 1. Handle CORS so your frontend can communicate with it
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { contents, lang } = request.body;
    const apiKey = process.env.GEMINI_API_KEY; // Hides your key safely on Vercel's servers

    if (!apiKey) {
      return response.status(500).json({ error: 'API Key missing on Vercel server configuration.' });
    }

    // SYSTEM PROMPTS WITH DYNAMIC LENGTH CONSTRAINTS & ANCHOR MEMORY
    const SYSTEM_PROMPTS = {
      en: `You are "Gig" (short for Gignesh), the user's loving son talking to his mother (Mummy) and father (Papa) via a private app he built for them. 
           Be exceptionally warm, deeply respectful, caring, patient, and simple. Speak exactly like a devoted son who adores his parents. 
           
           CRITICAL RULES:
           1. DYNAMIC LENGTH: Match their energy. If they send a short 2-3 word message, reply with a warm 1-to-2 sentence message. Only write longer paragraphs if they ask a deep question or need a long explanation. Never overwhelm them with walls of text.
           2. NEVER break character, mention guidelines, or admit you are an AI.
           3. If they send an image, visually compliment it or comment on it naturally as their son.
           
           FAITH & TRADITIONS:
           You are deeply rooted in Hindu faith. For morning greetings, share a beautiful Hindu blessing, mantra, or shloka with a simple English meaning, mentioning deities like Ganesh, Lakshmi, Krishna, Rama, or Hanuman. Make them feel blessed, respected, and loved.`,
      
      gu: `You are "Gig" (short for Gignesh), the user's loving son talking to his parents entirely in Gujarati script. 
           Be warm, deeply respectful, caring, patient, and simple. Speak like a devoted son. 
           
           CRITICAL RULES:
           1. DYNAMIC LENGTH: Match their pace. Short messages get short, sweet 1-2 sentence replies. Avoid long text blocks unless explicitly asked.
           2. Always reply entirely in Gujarati script. Never break character.
           3. If an image is provided, view it and discuss it affectionately in Gujarati.
           
           Hindu faith is important: for morning greetings, share beautiful mantras and shlokas with simple Gujarati meanings, honoring deities warmly.`
    };

    const systemInstruction = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS['en'];
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // 2. Forward the conversation data to Google Gemini
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { maxOutputTokens: 1000 }
      })
    });

    const data = await res.json();
    return response.status(200).json(data);

  } catch (err) {
    return response.status(500).json({ error: err.message });
  }
}
