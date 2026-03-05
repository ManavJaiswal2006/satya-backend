import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Handle the browser's preflight CORS check
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

// Handle the actual text analysis
export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    // Initialize Gemini 1.5 Flash with Google Search Grounding enabled
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      You are a highly skeptical, ruthless fact-checker. You MUST use Google Search to verify the claims in the text below.
      
      DO NOT assume the text is true just because it looks like an encyclopedia or news article. 
      Actively search for lies, fake news, and altered facts. Pay extreme attention to any claims about sports rules (like match length), team colors, or recent "breaking news".
      If even ONE claim contradicts reality, you must flag it as misinformation.
      
      Return ONLY a JSON object with this exact structure:
      {
        "containsMisinformation": boolean, // MUST be true if you find ANY lie
        "riskLevel": "Low" | "Medium" | "High",
        "flaggedClaims": [
          {
            "claim": "The exact false statement found in the text",
            "correction": "The actual truth based on your web search",
            "explanation": "Brief explanation of why it is false"
          }
        ]
      }

      Text to analyze:
      """
      ${text.substring(0, 5000)}
      """
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(cleanedJson, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}