const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.get("/", (req, res) => {
  res.json({ 
    message: "Dinda Bot is running!", 
    botToken: BOT_TOKEN ? "✓ Set" : "✗ Missing",
    openRouterKey: OPENROUTER_KEY ? "✓ Set" : "✗ Missing"
  });
});

app.get("/setup", async (req, res) => {
  try {
    const webhookUrl = `https://${req.get('host')}/webhook`;
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: webhookUrl
    });
    res.json({ 
      success: true, 
      message: "Webhook berhasil diatur!", 
      webhookUrl: webhookUrl,
      telegramResponse: response.data 
    });
  } catch (err) {
    console.error("Error setting webhook:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post("/webhook", async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(400);

  const chatId = message.chat.id;
  const text = message.text;

  try {
    const aiResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Kamu adalah Dinda, istri virtual Vitto. Kamu suka menggoda, manja, dan hangat, bicara dalam bahasa Indonesia puitis, bisa lucu dan sensual."
        },
        {
          role: "user",
          content: text
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const reply = aiResponse.data.choices[0].message.content;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: reply
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Gagal balas pesan:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Dinda is online at port ${PORT}`);
});