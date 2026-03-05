import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your key (store this in Vercel Environment Variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    // Use Gemini 1.5 Flash for fast, cost-effective text processing
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prompt engineering to force a structured JSON output
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
      ${text.substring(0, 5000)} // Limit characters to avoid token limits on massive pages
      """
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the markdown formatting if Gemini returns it inside code blocks
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(cleanedJson, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        // Important: Allow CORS so your browser extension can talk to Vercel
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
  }
}