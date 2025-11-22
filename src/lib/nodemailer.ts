import nodemailer from "nodemailer";
import type { TransportOptions } from "nodemailer";

// Get SMTP configuration
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const isSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: isSecure, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Connection options for better reliability
  connectionTimeout: 30000, // 30 seconds (increased for better reliability)
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
  // Disable pooling for serverless environments (Next.js API routes)
  pool: false,
  // For port 465 (SSL), requireTLS should be false
  // For port 587 (STARTTLS), requireTLS should be true
  requireTLS: !isSecure, // false for SSL (465), true for STARTTLS (587)
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false,
    // Use modern TLS
    minVersion: "TLSv1.2",
  },
} as TransportOptions);

// Verify connection configuration (only in development)
if (process.env.NODE_ENV === "development") {
  transporter.verify(function (error) {
    if (error) {
      console.error("SMTP connection error:", error);
      console.error("Make sure you're using an App Password, not your regular Gmail password");
      console.error("Check: https://support.google.com/accounts/answer/185833");
    } else {
      console.log("SMTP server is ready to send messages");
    }
  });
}

export default transporter;

