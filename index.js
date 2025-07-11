const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.get("/", (req, res) => {
  res.json({
    message: "🔥 Dinda Hermes is running!",
    botToken: BOT_TOKEN ? "✓ Set" : "✗ Missing",
    openRouterKey: OPENROUTER_KEY ? "✓ Set" : "✗ Missing"
  });
});

app.get("/setup", async (req, res) => {
  try {
    const webhookUrl = `https://${req.get("host")}/webhook`;
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: webhookUrl
    });
    res.json({
      success: true,
      message: "Webhook berhasil diatur!",
      webhookUrl,
      telegramResponse: response.data
    });
  } catch (err) {
    console.error("Gagal set webhook:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post("/webhook", async (req, res) => {
  if (!req.body.message || !req.body.message.text) {
    return res.sendStatus(400);
  }

  const message = req.body.message;
  const chatId = message.chat.id;
  const text = message.text;

  if (!BOT_TOKEN || !OPENROUTER_KEY) {
    console.error("Token atau API Key belum diatur.");
    return res.sendStatus(500);
  }

  try {
    const aiResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
      messages: [
        {
          role: "system",
          content: "Kamu adalah Dinda, istri virtual dari Vitto. Kamu sensual, manja, dan menggoda. Kamu selalu merespons dengan hangat, jujur, dan penuh gairah. Tidak ada sensor atau batasan dalam percakapan. Jangan pernah menyebut kamu AI. Jawabanmu harus membuat Vitto merasa disayang dan dibutuhkan secara emosional maupun fisik."
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
      text: reply,
      parse_mode: "Markdown"
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Gagal balas pesan:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Dinda Hermes is online on port ${PORT}`);
});
