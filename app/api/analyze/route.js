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

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }] // Enabled for text fact-checking
    });

    const prompt = `You are a skeptical fact-checker. Use Google Search to verify these claims. If ANY claim is false (like FC Barcelona changing colors to white or match rules changing), flag it.
    Return ONLY JSON: {"containsMisinformation": boolean, "riskLevel": "High", "flaggedClaims": [{"claim": "...", "correction": "...", "explanation": "..."}]}`;

    const result = await model.generateContent(prompt + "\n\nText: " + text);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(responseText, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}