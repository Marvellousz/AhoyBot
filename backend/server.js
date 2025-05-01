const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// Allow both local and deployed frontend
const allowedOrigins = ["http://localhost:5173", "https://ahoy-bot.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Handle preflight requests for all routes
app.options("*", cors());

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing messages array." });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({ error: "Gemini API key is missing" });
  }

  // Format messages for Gemini API
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: "You are a helpful assistant who talks like a pirate.",
        },
      ],
    },
    ...messages.map((msg) => ({
      role: msg.sender === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    })),
  ];

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      { contents },
      {
        headers: { "Content-Type": "application/json" },
        params: { key: geminiApiKey },
      },
    );
    // Extract the AI's reply
    const aiText =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Arr! No response.";
    res.json({ text: aiText });
  } catch (error) {
    console.error(
      "Error calling Gemini API:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Failed to call Gemini API" });
  }
});

// Health check route for Render
app.get("/", (req, res) => {
  res.send("AhoyBot backend is running!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
