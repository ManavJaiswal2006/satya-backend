from flask import Flask, request, jsonify
from flask_cors import CORS
import vertexai
from vertexai.generative_models import GenerativeModel, Tool, GoogleSearchRetrieval
import os
import json

app = Flask(__name__)
CORS(app)

# Use the key you just generated in Google Cloud
if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"):
    with open("google_creds.json", "w") as f:
        f.write(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON"))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_creds.json"

vertexai.init(project="monestry", location="us-central1") #

@app.route('/api/verify', methods=['POST'])
def verify():
    claim = request.json.get("claim")
    search_tool = Tool.from_google_search_retrieval(GoogleSearchRetrieval())
    model = GenerativeModel("gemini-1.5-flash")
    
    prompt = f"Verify this claim for an Indian audience: '{claim}'. Return JSON: {{'status': 'True/False', 'reason': '...', 'source': '...'}}"
    response = model.generate_content(prompt, tools=[search_tool])
    return response.text, 200, {'Content-Type': 'application/json'}