import React, { useState } from "react";
import "./App.css";
import imjjLogo from "./assets/imjj.png";

function App() {
  
  const [mode, setMode] = useState("General mode");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setChatHistory([]); // Clear chat history when mode changes
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value); // Update the input value for the question
  };

  const formatResponse = (response) => {
    // Split the response into sections using headings and text
    const formattedResponse = response
      .split(/\n+/) // Split by new lines
      .map(line => line.trim()) // Trim any extra spaces
      .filter(line => line) // Remove empty lines
      .reduce((acc, line) => {
        // Format headings and content in document-like structure
        if (line.match(/^([A-Z][A-Za-z0-9\s]+:)/)) {
          // If the line matches a heading pattern like 'Heading:'
          acc.push(<h3>{line}</h3>);
        } else {
          // Add the line as paragraph text
          acc.push(<p>{line}</p>);
        }
        return acc;
      }, []);

    return formattedResponse;
  };

  const handleSend = async () => {
    if (question.trim()) {
      const newEntry = { question, response: "Flivo is thinking..." };
      setChatHistory((prev) => [...prev, newEntry]);
      setQuestion(""); // Clear the input field
      setLoading(true);

      try {
        const res = await fetch("http://127.0.0.1:5000/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        });

        const data = await res.json();
        const responseText = data.response ? data.response.replace(/\*/g, "") : "An error occurred while generating the response.";
        const formattedResponse = formatResponse(responseText); // Format response as a document

        // Update the latest entry with the AI's formatted response
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1].response = formattedResponse;
          return updatedHistory;
        });
      } catch (error) {
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1].response = "An error occurred while connecting to the server.";
          return updatedHistory;
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={imjjLogo} alt="IMJJ Logo" className="logo" />
          <p className="logo-text">ASK</p>
        </div>
        <nav>
          <ul>
            <li onClick={() => handleModeChange("Modes")}>Modes</li>
            <li onClick={() => handleModeChange("General mode")}>General mode</li>
            <li onClick={() => handleModeChange("Document mode")}>Document mode</li>
            <li onClick={() => handleModeChange("Knowledge Graph mode")}>Knowledge Graph mode</li>
          </ul>
        </nav>
        <div className="footer">
          <button className="switch-button">Switch to current version</button>
        </div>
      </aside>

      <main className="content">
        <h2>Talk to FlivoAI</h2>

        <div className="chat-history">
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-entry">
              <p className="question">
                <strong></strong> {chat.question}
              </p>
              <div className="response">
                <strong></strong>
                {/* Display the formatted response */}
                {chat.response}
              </div>
            </div>
          ))}
        </div>

        <div className="chatbox">
          <input
            type="text"
            placeholder="Ask something here..."
            value={question}
            onChange={handleQuestionChange}
            disabled={loading}
          />
          <button className="send-button" onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
