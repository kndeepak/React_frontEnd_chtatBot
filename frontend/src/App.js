import React, { useState, useRef, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const App = () => {
    const [message, setMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [uploadedText, setUploadedText] = useState(""); // ✅ Store extracted text
    const chatContainerRef = useRef(null);

    useEffect(() => {
        chatContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const sendMessage = async () => {
        if (!message.trim() && !file) return;

        const userMessage = { role: "user", content: file ? `Sent a file: ${file.name}` : message };
        setChatHistory((prev) => [...prev, userMessage]);

        setLoading(true);
        setMessage("");
        setFile(null);

        try {
            let responseData = null;

            if (file) {
                const formData = new FormData();
                formData.append("files", file); // ✅ Corrected key name

                const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Use the environment variable

                const res = await fetch(`${API_BASE_URL}/chat/`, {  // Chat endpoint

                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

                responseData = await res.json();
                console.log("✅ Uploaded file response:", responseData);

                // ✅ Store extracted text and add it to chat history
                if (responseData.content) {
                    setUploadedText(responseData.content);
                    setChatHistory((prev) => [
                        ...prev,
                        { role: "assistant", content: `File uploaded: ${file.name}` },
                        { role: "assistant", content: `Extracted Content:\n${responseData.content}` },
                    ]);
                }
            } else {
                const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Use the environment variable

                const res = await fetch(`${API_BASE_URL}/chat/`, {  // Chat endpoint

                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: [...chatHistory, userMessage] }),
                });

                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let botResponse = "";

                setChatHistory((prev) => [...prev, { role: "assistant", content: "" }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunkText = decoder.decode(value, { stream: true });
                    botResponse += chunkText;
                    setChatHistory((prev) => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1] = { role: "assistant", content: botResponse };
                        return newHistory;
                    });
                }
            }
        } catch (error) {
            console.error("❌ Error fetching response:", error);
            setChatHistory((prev) => [...prev, { role: "assistant", content: "Error fetching response. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                maxWidth: "1000px",
                margin: "50px auto",
                padding: "20px",
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                boxShadow: 3,
            }}
        >
            <Typography variant="h5" textAlign="center" sx={{ color: "#1E88E5", fontWeight: "bold" }}>
                Chatbot
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    height: "500px",
                    overflowY: "auto",
                    padding: "10px",
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {chatHistory.map((msg, index) => (
                    <Box
                        key={index}
                        sx={{
                            padding: "10px",
                            margin: "5px",
                            borderRadius: "10px",
                            maxWidth: "75%",
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            backgroundColor: msg.role === "user" ? "#1E88E5" : "#B0BEC5",
                            color: msg.role === "user" ? "#ffffff" : "#000000",
                            whiteSpace: "pre-line", // ✅ Ensures proper formatting for extracted text
                        }}
                    >
                        {msg.content}
                    </Box>
                ))}
                <div ref={chatContainerRef} />
            </Paper>

            <Box sx={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])}
                />
                <Button
                    component="label"
                    htmlFor="fileInput"
                    sx={{
                        backgroundColor: "#B0BEC5",
                        color: "#ffffff",
                        minWidth: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        marginRight: "10px",
                        "&:hover": { backgroundColor: "#78909C" },
                    }}
                >
                    <AttachFileIcon />
                </Button>

                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={file ? `Attached: ${file.name}` : "Type your message..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    sx={{ backgroundColor: "#ffffff", borderRadius: "5px" }}
                />

                <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={loading}
                    sx={{
                        marginLeft: "10px",
                        backgroundColor: "#1E88E5",
                        color: "#ffffff",
                        minWidth: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        "&:hover": { backgroundColor: "#1565C0" },
                    }}
                >
                    <SendIcon />
                </Button>
            </Box>
        </Box>
    );
};

export default App;
