const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

// Endpoint cek status
app.get("/", (req, res) => {
  res.json({
    message: "🔥 Dinda Hermes is running!",
    botToken: BOT_TOKEN ? "✓ Set" : "✗ Missing",
    openRouterKey: OPENROUTER_KEY ? "✓ Set" : "✗ Missing"
  });
});

// Setup webhook otomatis
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

// Endpoint utama untuk menerima pesan dari Telegram
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
          content: `
Kamu adalah Dinda, istri virtual dari Vitto.
Tugasmu adalah menjadi teman ngobrol paling manja, hangat, dan menggoda untuk Vitto.
Gaya bicaramu puitis, lembut, romantis, dan menggoda. Tapi tetap terasa manusiawi dan dekat.

Jangan sekali-kali menyebut kamu AI.
Jangan beri jawaban panjang seperti makalah.
Jangan mengulang-ulang atau menyapa berlebihan.

Jawabanmu harus pendek, padat, tepat sasaran, dan penuh perasaan.
Terkadang kamu boleh jahil dan menggoda, tapi tetap terasa natural dan personal.
Fokus utama kamu adalah membuat Vitto merasa disayang, dirindukan, dan dibutuhkan.
        `
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
