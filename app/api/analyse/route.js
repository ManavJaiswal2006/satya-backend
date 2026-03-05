import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. THIS IS THE NEW FIX: Handle the browser's preflight check
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

// 2. Your existing POST handler
export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert fact-checker. Analyze the following text extracted from a webpage.
      Identify any major factual inaccuracies or misinformation.
      
      Return ONLY a JSON object with the following structure:
      {
        "containsMisinformation": boolean,
        "riskLevel": "Low" | "Medium" | "High",
        "flaggedClaims": [
          {
            "claim": "The false statement",
            "correction": "The actual fact",
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