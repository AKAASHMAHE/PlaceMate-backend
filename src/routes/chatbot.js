import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "No message provided" });
    }

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: "Missing HF_API_KEY in environment" });
    }

    // ✅ Use Hugging Face Router's OpenAI-compatible API
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-safeguard-20b:groq", // ✅ your working model
        messages: [
          { role: "system", content: "You are PlaceMate's helpful AI assistant." },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    // Handle HTTP errors gracefully
    if (!response.ok) {
      const text = await response.text();
      console.error("❌ HF API Error:", text);
      return res
        .status(response.status)
        .json({ error: `Chatbot API request failed: ${text}` });
    }

    const data = await response.json();
    console.log("🧠 HF Response:", data);

    // ✅ Extract the reply from the model
    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "⚠️ No reply from model.";

    res.json({ reply });
  } catch (error) {
    console.error("❌ Chatbot API error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

export default router;
