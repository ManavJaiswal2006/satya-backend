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
      You are an expert fact-checker. You must thoroughly analyze the text below.
      
      Step 1: Extract EVERY factual claim made in the text.
      Step 2: Use Google Search to rigorously verify each claim. 
      Step 3: If a claim is false, satirical, or fake (for example: FC Barcelona changing kit colors to white, or football rules changing to 15 players/45 minutes), you MUST flag it.

      Return ONLY a raw JSON object matching this exact structure:
      {
        "containsMisinformation": true, // Set to true if ANY claim is false
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
      ${text}
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