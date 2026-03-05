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

    const apiKey = process.env.GEMINI_API_KEY;
    // We bypass the SDK and call the 1.5-flash model directly over the web!
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
      You are an expert fact-checker and digital literacy educator. 
      Analyze the text provided. Look for ANY factual inaccuracies, fake news, outdated information, or logical fallacies.
      
      If you find misinformation, you must educate the user by identifying the manipulation technique used (e.g., Fabricated Fact, Out of Context, Emotional Appeal, Clickbait).
      
      Return ONLY a raw JSON object:
      {
        "containsMisinformation": true,
        "riskLevel": "Low", "Medium", or "High",
        "flaggedClaims": [
          {
            "claim": "The exact false statement found in the text",
            "correction": "The actual verified truth",
            "explanation": "Why it is false AND the specific manipulation technique used to trick the reader."
          }
        ]
      }
      
      TEXT TO CHECK:
      ${text}
    `;

    // Make a direct web request to Google's servers
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    // Catch any API errors directly
    if (!response.ok) {
       return new Response(JSON.stringify({ error: data.error?.message || 'Direct Gemini API Error' }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Extract and clean the AI's response
    const responseText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    
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