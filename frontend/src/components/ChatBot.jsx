import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ChatBot = ({ subjectId }) => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    const getToken = () => {
        try {
            const userInfo = localStorage.getItem("userInfo");
            return userInfo ? JSON.parse(userInfo).token : null;
        } catch { return null; }
    };

    const askQuestion = async () => {
        if (!question.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/ai/rag-ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    question: question,
                    subject_id: subjectId
                })
            });

            const data = await res.json();
            setAnswer(data.answer || "No answer returned.");
        } catch (err) {
            setAnswer("Error getting response");
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            askQuestion();
        }
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, marginTop: 20 }}>
            <h3>Ask AI about this subject</h3>

            <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />

            <button onClick={askQuestion} disabled={loading} style={{ marginTop: 10 }}>
                {loading ? "Thinking..." : "Ask"}
            </button>

            {answer && (
                <p style={{ marginTop: 10 }}>
                    <strong>Answer:</strong> {answer}
                </p>
            )}
        </div>
    );
};

export default ChatBot;
