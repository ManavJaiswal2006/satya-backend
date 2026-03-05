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
      You are an expert fact-checker with access to Google Search. 
      Analyze the following text extracted from a webpage. Use Google Search to verify the claims made in the text against reliable, real-world sources.
      Identify any major factual inaccuracies, fake news, or misinformation.
      
      Return ONLY a JSON object with the following structure:
      {
        "containsMisinformation": boolean,
        "riskLevel": "Low" | "Medium" | "High",
        "flaggedClaims": [
          {
            "claim": "The false statement",
            "correction": "The actual fact based on your web search",
            "explanation": "Brief explanation of why it is false, citing what you found"
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