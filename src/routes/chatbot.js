import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    // Call Hugging Face API
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:nebius",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    res.json({
      reply: data.choices?.[0]?.message?.content || "⚠️ No reply from model",
    });
  } catch (error) {
    console.error("❌ Chatbot API error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
});
export default router;