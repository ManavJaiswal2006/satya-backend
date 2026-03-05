from flask import Flask, request, jsonify
from flask_cors import CORS
import vertexai
from vertexai.generative_models import GenerativeModel, Tool, GoogleSearchRetrieval
import os

app = Flask(__name__)
CORS(app) # This handles the cross-origin errors from your Edge extension

# Initialize Vertex AI - You still need your Google Cloud Project ID
PROJECT_ID = "monestry" #
vertexai.init(project=PROJECT_ID, location="us-central1")

@app.route('/api/verify', methods=['POST'])
def verify():
    data = request.json
    claim = data.get("claim")
    
    if not claim:
        return jsonify({"error": "No claim provided"}), 400

    # Gemini with Search Grounding
    search_tool = Tool.from_google_search_retrieval(
        google_search_retrieval=GoogleSearchRetrieval()
    )
    model = GenerativeModel("gemini-1.5-flash")

    prompt = f"Verify this claim for an Indian audience: '{claim}'. Return JSON: {{'status': 'True/False/Unverified', 'reason': 'short explanation', 'source': 'URL'}}"
    
    try:
        response = model.generate_content(prompt, tools=[search_tool])
        # Clean up Gemini's markdown
        result = response.text.replace("```json", "").replace("```", "").strip()
        return result, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel needs this to route correctly
def handler(event, context):
    return app(event, context)