import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:nebius",
        messages: [{ role: "user", content: "Hello" }],
      }),
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
})();
