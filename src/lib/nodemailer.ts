import nodemailer from "nodemailer";
import type { TransportOptions } from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Connection options for better reliability
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  // Disable pooling for serverless environments (Next.js API routes)
  pool: false,
  // Enable TLS/STARTTLS
  requireTLS: true,
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

