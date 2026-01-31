import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("QuietMind backend running");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message.toLowerCase();

    // ----------------------------
    // Mental health keywords
    // ----------------------------
    const allowedKeywords = [
      "sad", "depressed", "depression",
      "anxious", "anxiety",
      "stress", "stressed",
      "lonely", "alone",
      "tired", "exhausted",
      "hopeless",
      "panic", "panicking",
      "scared", "afraid",
      "overwhelmed",
      "cry", "crying",
      "worthless",
      "empty",
      "suicide",
      "kill myself",
      "end my life"
    ];

    // ----------------------------
    // Suicide emergency
    // ----------------------------
    if (
      userMessage.includes("suicide") ||
      userMessage.includes("kill myself") ||
      userMessage.includes("end my life")
    ) {
      return res.json({
        reply:
          "I'm really sorry you're feeling this much pain. You deserve care and support. You are not alone. Please reach out to someone you trust or contact your local suicide prevention helpline immediately."
      });
    }

    // ----------------------------
    // Main filter (with typo tolerance)
    // ----------------------------
    const isMentalHealthRelated =
      allowedKeywords.some(word => userMessage.includes(word)) ||
      userMessage.split(" ").length > 3 ||   // long sentences allowed
      userMessage.length > 15;               // catches misspellings

    if (!isMentalHealthRelated) {
      return res.json({
        reply:
          "I'm here to support emotional and mental well-being. If you're feeling sad, anxious, stressed, or overwhelmed, you can talk to me about it."
      });
    }

    // ----------------------------
    // Send to Gemini
    // ----------------------------
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "You are a gentle, calm mental health support companion. You do not give medical diagnoses. You listen, validate feelings, suggest small coping steps, and encourage reaching out to trusted people or professionals when needed.\n\nUser: " +
                    userMessage
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here with you.";

    res.json({ reply });

  } catch (error) {
    console.log(error);
    res.json({ reply: "I'm here with you." });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
