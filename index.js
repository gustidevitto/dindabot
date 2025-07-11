const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

// 🔧 Root test endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Dinda Bot is running!", 
    botToken: BOT_TOKEN ? "✓ Set" : "✗ Missing",
    openRouterKey: OPENROUTER_KEY ? "✓ Set" : "✗ Missing"
  });
});

// 🔧 Webhook auto-setup (opsional)
app.get("/setup", async (req, res) => {
  try {
    const webhookUrl = `https://${req.get('host')}/webhook`;
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: webhookUrl
    });
    res.json({ success: true, webhookUrl, telegramResponse: response.data });
  } catch (err) {
    console.error("Gagal atur webhook:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 🚀 Webhook utama
app.post("/webhook", as
