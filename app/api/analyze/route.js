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
// Keep your existing OPTIONS function at the top for CORS!

export async function POST(req) {
  try {
    // We are now expecting an 'image' from the extension
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      tools: [{ googleSearch: {} }] 
    });

    // 1. Convert the browser's image format into Gemini's format
    const base64Data = image.split(',')[1]; 
    const mimeType = image.split(';')[0].split(':')[1]; 

    const imagePart = {
      inlineData: { data: base64Data, mimeType }
    };

    // 2. Tweak the prompt to tell it to look at the image
    const prompt = `
      You are an expert fact-checker. I have provided a screenshot of a webpage. 
      Read the visible text in the screenshot and use Google Search to verify the main claims.
      
      Look actively for lies, fake news, and altered facts. 
      If even ONE claim contradicts reality, you must flag it as misinformation.
      
      Return ONLY a JSON object with this exact structure:
      {
        "containsMisinformation": boolean, 
        "riskLevel": "Low" | "Medium" | "High",
        "flaggedClaims": [
          {
            "claim": "The false statement found in the image",
            "correction": "The actual truth based on your web search",
            "explanation": "Brief explanation of why it is false"
          }
        ]
      }
    `;

    // 3. Send BOTH the prompt and the image to Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(cleanedJson, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}