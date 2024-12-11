from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS for enabling cross-origin requests
import google.generativeai as genai
import justiceAI_prompt as jp
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all origins
CORS(app)

# User-specific details
ai_name = "Flivo AI"

# Configure API key
api_key = "AIzaSyDgc78PnoUQUau0m4QbAUJtYIv9BKNbHhU"
genai.configure(api_key=api_key)

# Initialize the model
model = genai.GenerativeModel('gemini-pro')

# Initialize conversation history log
conversation_log = []


def summarize_response(ai_response):
    """Summarizes AI responses to less than 100 characters."""
    summary_prompt = f"""
    Please summarize the following response in less than 100 characters:
    "{ai_response}"
    """
    try:
        summary_response = model.generate_content(summary_prompt)
        return summary_response.text.strip()
    except Exception as e:
        logging.error(f"Error summarizing response: {e}")
        return "Summary could not be generated."


def save_conversation(question, ai_response):
    """Saves the conversation by summarizing and logging it."""
    summarized_response = summarize_response(ai_response)
    conversation_log.append({'question': question, 'response_summary': summarized_response})


def generate_prompt(Question_input):
    """Generates the prompt for the AI model."""
    summary = "\n".join(
        [f"User asked: '{log['question']}', AI responded: '{log['response_summary']}'"
         for log in conversation_log]
    ) if conversation_log else "No previous conversation history yet."

    # Instruct the model to generate a 1000-word response
    instruction = "\nPlease provide a detailed and coherent response of approximately 1000 words."

    prompt = jp.prompt + "\nNow the question is: " + Question_input + "\nAnd the previous conversation was this: " + summary + instruction
    return prompt


def generate_ai_response(prompt):
    """Generates a 1000-word response from the AI."""
    try:
        # Assuming the model supports a max_tokens parameter, set it for longer responses.
        response = model.generate_content(prompt)  # Adjust max_tokens if needed
        return response.text
    except Exception as e:
        logging.error(f"Error generating response: {e}")
        return "An error occurred while generating the response."


@app.route("/ask", methods=["POST"])
def ask():
    """Handles the POST request from the frontend."""
    try:
        data = request.get_json()
        question = data.get("question")
        if not question:
            return jsonify({"response": "No question provided."}), 400

        # Generate the AI prompt and get a response
        prompt = generate_prompt(question)
        response = generate_ai_response(prompt)

        # Save conversation
        save_conversation(question, response)

        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
