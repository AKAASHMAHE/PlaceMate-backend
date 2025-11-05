import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "No message provided" });
    }

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: "Missing HF_API_KEY in environment" });
    }

    // ✅ Use your model directly via the Inference API (no more 410)
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `User: ${message}\nAssistant:`,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ HF API Error:", text);
      return res.status(response.status).json({ error: "Chatbot API request failed" });
    }

    const data = await response.json();
    console.log("🧠 HF Response:", data);

    let reply = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (typeof data === "string") {
      reply = data;
    }

    if (!reply?.trim()) {
      console.warn("⚠️ No valid reply from model:", data);
      reply = "⚠️ No reply from model.";
    }

    res.json({ reply });
  } catch (error) {
    console.error("❌ Chatbot API error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

export default router;
