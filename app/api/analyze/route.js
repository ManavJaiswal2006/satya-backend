import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });

    // FIX: Removed the googleSearch tool that was causing the 500 crash!
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are a RUTHLESS fact-checker. 
      Analyze the text provided by the user. If it claims FC Barcelona is changing to white kits, or UEFA match rules are changing to 45 minutes/15 players, FLAG IT IMMEDIATELY as fake news.
      
      Return ONLY a raw JSON object:
      {
        "containsMisinformation": true,
        "riskLevel": "High",
        "flaggedClaims": [
          {
            "claim": "The exact false statement found",
            "correction": "The actual truth",
            "explanation": "Why this is false."
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt + "\n\nTEXT TO CHECK:\n" + text);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(responseText, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
}