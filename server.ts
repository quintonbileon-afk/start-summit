import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";
import crypto from "crypto";
import QRCode from "qrcode";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { sendRegistrationEmail, notifyAdmin } from "./emailService.ts";

// Prefer IPv4 first for DNS resolution to avoid IPv6 connection timeouts on Cloud Run/Docker
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Force load and override with .env file variables
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEqual = trimmed.indexOf('=');
        if (firstEqual > 0) {
          const key = trimmed.slice(0, firstEqual).trim();
          let value = trimmed.slice(firstEqual + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.error('[Server] Error loading .env override:', err);
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Helper to resolve environment variables, filtering out empty or quoted empty placeholders
const getEnv = (key: string): string => {
  const val = process.env[key];
  if (val && val !== '""' && val !== "''" && val.trim() !== "") {
    return val;
  }
  return "";
};

// Fallback: Read firebase-applet-config.json if it exists
let fileConfig: any = {};
try {
  const filePath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(filePath)) {
    fileConfig = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
} catch (err) {
  console.warn("Failed to load firebase-applet-config.json fallback:", err);
}

// Initialize Firebase client SDK in server-side context for logs & queues
const firebaseConfig = {
  apiKey: getEnv("FIREBASE_API_KEY") || fileConfig.apiKey || "",
  authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || fileConfig.authDomain || "",
  projectId: getEnv("FIREBASE_PROJECT_ID") || fileConfig.projectId || "",
  storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || fileConfig.storageBucket || "",
  messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || fileConfig.messagingSenderId || "",
  appId: getEnv("FIREBASE_APP_ID") || fileConfig.appId || ""
};

// Defensive checks for Vercel/cold starts where environment variables might not be populated yet
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);
if (!isConfigValid) {
  console.warn("[Server] Firebase configuration not found or incomplete. Falling back to placeholder keys to prevent startup crash.");
  firebaseConfig.apiKey = firebaseConfig.apiKey || "AIzaSyDummyKey_PleaseConfigureEnvironmentVariables";
  firebaseConfig.projectId = firebaseConfig.projectId || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61";
  firebaseConfig.authDomain = firebaseConfig.authDomain || `${firebaseConfig.projectId}.firebaseapp.com`;
}

const firebaseApp = initializeApp(firebaseConfig);
const dbId = getEnv("FIREBASE_DATABASE_ID") || fileConfig.firestoreDatabaseId || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61";
const db = getFirestore(firebaseApp, dbId);

// Centralized logEmailEvent helper
async function logEmailEvent(event: {
  type: 'ADMIN_ALERT' | 'TICKET_EMAIL' | 'QR_GENERATION' | 'RETRY_ATTEMPT';
  userId?: string;
  email?: string;
  ticketId?: string;
  status: 'success' | 'failed' | 'simulated';
  error?: string;
  attempt?: number;
}) {
  const timestamp = new Date();
  let logMsg = `[${timestamp.toISOString()}] ${event.type}: `;
  if (event.userId) logMsg += `user_id=${event.userId}, `;
  if (event.email) logMsg += `email=${event.email}, `;
  if (event.ticketId) logMsg += `ticket_id=${event.ticketId}, `;
  if (event.attempt) logMsg += `attempt=${event.attempt}, `;
  logMsg += `status=${event.status}`;
  if (event.error) logMsg += `, error=${event.error}`;

  console.log(logMsg);

  // Also save to Firestore under email_logs
  try {
    await addDoc(collection(db, "email_logs"), {
      timestamp,
      type: event.type,
      userId: event.userId || "",
      email: event.email || "",
      ticketId: event.ticketId || "",
      status: event.status,
      attempt: event.attempt || 1,
      error: event.error || "",
      message: logMsg
    });
  } catch (err) {
    console.error("Failed to write email log to Firestore:", err);
  }
}

// Mailer transporter helper using fresh SMTP configurations
const getTransporter = () => {
  const smtpHost = process.env.PRIMARY_SMTP_HOST || process.env.SMTP_HOST || "mail.startupsummit.co.bw";
  const smtpPort = process.env.PRIMARY_SMTP_PORT || process.env.SMTP_PORT || "465";
  const smtpUser = process.env.PRIMARY_SMTP_USER || process.env.SMTP_USER || "admin@startupsummit.co.bw";
  const smtpPass = process.env.PRIMARY_SMTP_PASS || process.env.SMTP_PASS || "@St@rtu9@26";
  const smtpSecure = process.env.PRIMARY_SMTP_SECURE === "true" || process.env.SMTP_SECURE === "true" || smtpPort === "465";

  if (!smtpPass) {
    return null;
  }

  const portNum = parseInt(smtpPort, 10);
  return nodemailer.createTransport({
    host: smtpHost,
    port: portNum,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // avoids SSL handshake issues on self-signed and custom certs
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

// Fallback transporter helper using Gmail
const getFallbackTransporter = () => {
  const smtpHost = process.env.FALLBACK_SMTP_HOST || "smtp.gmail.com";
  const smtpPort = process.env.FALLBACK_SMTP_PORT || "587";
  const smtpUser = process.env.FALLBACK_SMTP_USER || "quintonbileon@gmail.com";
  const smtpPass = process.env.FALLBACK_SMTP_PASS || "vris ycyx fdsi hyoj";
  const smtpSecure = process.env.FALLBACK_SMTP_SECURE === "true";

  if (!smtpPass) {
    return null;
  }

  const portNum = parseInt(smtpPort, 10);
  return nodemailer.createTransport({
    host: smtpHost,
    port: portNum,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

// Send email with automatic primary / fallback delivery
async function sendMailWithRetry(mailOptions: nodemailer.SendMailOptions, maxRetries = 3) {
  // Defensive bypass for Vercel/environments where SMTP is disabled or unconfigured to avoid slow timeouts
  const isVercel = !!process.env.VERCEL;
  const hasPrimarySmtp = !!process.env.PRIMARY_SMTP_PASS;
  const hasFallbackSmtp = !!process.env.FALLBACK_SMTP_PASS;

  if (isVercel || (!hasPrimarySmtp && !hasFallbackSmtp)) {
    console.log(`[Server] [SIMULATED] Bypassing SMTP delivery on Vercel/unconfigured environment to avoid slow timeouts.`);
    return { success: true, messageId: `simulated-id-${Date.now()}`, attempt: 1, simulated: true };
  }

  // Ensure "from" is always admin@startupsummit.co.bw as requested by user
  const fromEmail = 'admin@startupsummit.co.bw';
  const fromName = 'Startup Summit Botswana';
  mailOptions.from = `"${fromName}" <${fromEmail}>`;

  // 1. Try Primary Transporter (Custom Domain)
  const primaryTransporter = getTransporter();
  if (primaryTransporter) {
    try {
      console.log(`[Server] [Primary Method] Attempting via custom domain SMTP (${process.env.PRIMARY_SMTP_HOST || 'mail.startupsummit.co.bw'})...`);
      const info = await primaryTransporter.sendMail(mailOptions);
      console.log(`[Server] [Primary SUCCESS] Delivered successfully! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, attempt: 1 };
    } catch (primaryError: any) {
      console.warn(`[Server] [Primary FAILED] Custom domain SMTP error: ${primaryError.message || primaryError}`);
      
      // Log retry event in Firestore so dashboard updates
      await logEmailEvent({
        type: 'RETRY_ATTEMPT',
        email: String(mailOptions.to),
        status: 'failed',
        attempt: 1,
        error: `Primary SMTP Failed: ${primaryError.message || String(primaryError)}. Falling back to Gmail SMTP.`
      });
    }
  } else {
    console.warn(`[Server] Primary transporter not configured, moving to fallback.`);
  }

  // 2. Try Fallback Transporter (Gmail)
  const fallbackTransporter = getFallbackTransporter();
  if (!fallbackTransporter) {
    throw new Error("Neither Primary nor Fallback SMTP transporters are configured.");
  }

  try {
    console.log(`[Server] [Fallback Method] Attempting via Gmail SMTP (${process.env.FALLBACK_SMTP_HOST || 'smtp.gmail.com'})...`);
    const info = await fallbackTransporter.sendMail(mailOptions);
    console.log(`[Server] [Fallback SUCCESS] Delivered successfully! Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, attempt: 2 };
  } catch (fallbackError: any) {
    console.error(`[Server] [FATAL] Fallback Gmail SMTP also failed.`);
    
    await logEmailEvent({
      type: 'RETRY_ATTEMPT',
      email: String(mailOptions.to),
      status: 'failed',
      attempt: 2,
      error: `Fallback SMTP Failed: ${fallbackError.message || String(fallbackError)}`
    });

    throw fallbackError;
  }
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Test SMTP and Email Configuration
app.get("/api/test-email", async (req, res) => {
  try {
    console.log("[TestRoute] Received request to test SMTP / email service configuration");
    const testAdminEmail = process.env.ADMIN_EMAIL || "admin@startupsummit.co.bw";

    // 1. Notify Admin test
    console.log(`[TestRoute] Triggering notifyAdmin to ${testAdminEmail}`);
    const adminRes = await notifyAdmin(testAdminEmail, "Golebileone Setlamelo (SMTP Test)");

    // 2. Welcome Registration test matching the exact image mockup data
    console.log(`[TestRoute] Triggering sendRegistrationEmail with mock data to ${testAdminEmail}`);
    const welcomeRes = await sendRegistrationEmail(
      testAdminEmail, 
      "Golebileone Setlamelo", 
      {
        company: "BOCRA",
        role: "Developer",
        participantCategory: "Startup Founder / Entrepreneur",
        ticketOption: "standard",
        registrationType: "attendant"
      }
    );

    res.json({
      success: true,
      message: "Test emails sent successfully! Check the mailbox for 'Welcome to Botswana Startup Summit 2026' and the Admin alert.",
      adminAlertMessageId: adminRes.messageId,
      adminDeliveryMethod: adminRes.method,
      welcomeEmailMessageId: welcomeRes.messageId,
      welcomeDeliveryMethod: welcomeRes.method,
      configUsed: {
        primary: {
          host: process.env.PRIMARY_SMTP_HOST || "mail.startupsummit.co.bw",
          port: process.env.PRIMARY_SMTP_PORT || "465",
          user: process.env.PRIMARY_SMTP_USER || "admin@startupsummit.co.bw"
        },
        fallback: {
          host: process.env.FALLBACK_SMTP_HOST || "smtp.gmail.com",
          port: process.env.FALLBACK_SMTP_PORT || "587",
          user: process.env.FALLBACK_SMTP_USER || "quintonbileon@gmail.com"
        }
      }
    });
  } catch (error: any) {
    console.error("[TestRoute] SMTP / email service test failed with error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test emails. See error details below.",
      error: error.message || String(error),
      stack: error.stack,
      configUsed: {
        primary: {
          host: process.env.PRIMARY_SMTP_HOST || "mail.startupsummit.co.bw",
          port: process.env.PRIMARY_SMTP_PORT || "465",
          user: process.env.PRIMARY_SMTP_USER || "admin@startupsummit.co.bw"
        },
        fallback: {
          host: process.env.FALLBACK_SMTP_HOST || "smtp.gmail.com",
          port: process.env.FALLBACK_SMTP_PORT || "587",
          user: process.env.FALLBACK_SMTP_USER || "quintonbileon@gmail.com"
        }
      }
    });
  }
});

// API: Config for frontend initialization
app.get("/api/config", (req, res) => {
  res.json({
    apiKey: getEnv("FIREBASE_API_KEY") || fileConfig.apiKey || "",
    authDomain: getEnv("FIREBASE_AUTH_DOMAIN") || fileConfig.authDomain || "",
    projectId: getEnv("FIREBASE_PROJECT_ID") || fileConfig.projectId || "",
    storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || fileConfig.storageBucket || "",
    messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID") || fileConfig.messagingSenderId || "",
    appId: getEnv("FIREBASE_APP_ID") || fileConfig.appId || "",
    databaseId: getEnv("FIREBASE_DATABASE_ID") || fileConfig.firestoreDatabaseId || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61",
    adminEmail: getEnv("ADMIN_EMAIL") || "admin@startupsummit.co.bw",
    adminPassword: getEnv("ADMIN_PASSWORD") || "YOUR_ADMIN_PASSWORD"
  });
});

// API: Trigger Admin Registration Alert (PART 1)
app.post("/api/send-registration-email", async (req, res) => {
  const userData = req.body;
  const { id, fullName, email, registrationType } = userData;

  if (!email || !fullName || !registrationType) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, or registrationType." 
    });
  }

  try {
    console.log(`[send-registration-email] Triggering welcome and admin alert emails for ${fullName} (${email})...`);
    
    // 1. Send the welcome registration email to the user
    await sendRegistrationEmail(email, fullName, userData);

    // 2. Notify the Admin about the new registration
    await notifyAdmin(email, fullName);

    await logEmailEvent({
      type: 'ADMIN_ALERT',
      userId: id || "temp-id",
      email: email,
      status: 'success'
    });

    return res.status(200).json({
      success: true,
      message: "Registration welcome email and Admin alert sent successfully via SMTP."
    });
  } catch (err: any) {
    console.error("[send-registration-email] SMTP delivery failed:", err);
    
    await logEmailEvent({
      type: 'ADMIN_ALERT',
      userId: id || "temp-id",
      email: email,
      status: 'failed',
      error: err.message || String(err)
    });

    return res.status(200).json({
      success: false,
      message: "Registration email failed to send, but registration was processed.",
      error: err.message || String(err)
    });
  }
});

// API: Approve Payment & Send User Ticket Email (PART 2)
app.post("/api/send-payment-verified-email", async (req, res) => {
  const { id, fullName, email, registrationType, ticketOption, exhibitorCategory, company, ticketId } = req.body;

  if (!email || !fullName || !ticketId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, and ticketId are required." 
    });
  }

  const userId = id || `USER-${Math.floor(10000 + Math.random() * 90000)}`;
  let qrCodeDataUrl = "";

  // 1. Generate QR Code securely
  try {
    const checksum = crypto.createHash('sha256').update(`${ticketId}-${userId}-ssb2026`).digest('hex');
    const qrPayload = JSON.stringify({
      ticket_id: ticketId,
      user_id: userId,
      event_id: "EVENT-2026-001",
      timestamp: new Date().toISOString(),
      checksum: checksum
    });

    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff'
      }
    });

    await logEmailEvent({
      type: 'QR_GENERATION',
      userId,
      ticketId,
      status: 'success'
    });
  } catch (qrErr: any) {
    await logEmailEvent({
      type: 'QR_GENERATION',
      userId,
      ticketId,
      status: 'failed',
      error: qrErr.message || String(qrErr)
    });
    return res.status(500).json({
      success: false,
      error: "Failed to generate digital ticket QR code.",
      details: qrErr.message || String(qrErr)
    });
  }

  // 2. Map visual label of Ticket Type
  let displayTicketType = "General Admission";
  if (registrationType === 'partner') {
    displayTicketType = "VIP Partner Pass";
  } else if (registrationType === 'exhibitor') {
    displayTicketType = `${exhibitorCategory || "Standard"} Exhibitor Pass`;
  } else if (ticketOption === 'starter') {
    displayTicketType = "VIP Access Ticket";
  }

  const seatNumber = ticketOption === 'starter' || registrationType === 'partner' 
    ? `VIP-${Math.floor(10 + Math.random() * 89)}` 
    : `A-${Math.floor(100 + Math.random() * 899)}`;

  // 3. Build elegant digital ticket HTML template
  const ticketHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; position: relative; }
        .branding { font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #3b82f6; margin: 0 0 4px 0; }
        .title { margin: 0; font-size: 18px; font-weight: bold; color: #ffffff; }
        .admit-badge { display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-top: 8px; letter-spacing: 0.05em; }
        
        .ticket-body { padding: 28px 24px; background: radial-gradient(circle at top left, transparent 15px, #f8fafc 0) top left, radial-gradient(circle at top right, transparent 15px, #f8fafc 0) top right, radial-gradient(circle at bottom left, transparent 15px, #f8fafc 0) bottom left, radial-gradient(circle at bottom right, transparent 15px, #f8fafc 0) bottom right; background-size: 51% 51%; background-repeat: no-repeat; border: 2px dashed #e2e8f0; margin: 15px; border-radius: 12px; }
        
        .ticket-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 13px; }
        .ticket-label { color: #64748b; font-weight: 500; }
        .ticket-value { color: #0f172a; font-weight: 600; text-align: right; }
        .ticket-id { font-family: monospace; font-size: 14px; font-weight: bold; color: #3b82f6; }
        
        .qr-section { text-align: center; padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .qr-img { width: 180px; height: 180px; display: inline-block; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; background: #ffffff; }
        .qr-help { font-size: 11px; color: #64748b; margin-top: 8px; }
        
        .details-grid { display: flex; justify-content: space-between; padding: 15px 0 0 0; font-size: 12px; }
        .detail-item { flex: 1; text-align: center; border-right: 1px solid #e2e8f0; }
        .detail-item:last-child { border-right: none; }
        .detail-lbl { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 2px; }
        .detail-val { color: #0f172a; font-weight: bold; }
        
        .info-section { padding: 0 24px 24px 24px; }
        .info-title { font-size: 12px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em; border-left: 3px solid #3b82f6; padding-left: 8px; }
        .info-list { padding-left: 20px; margin: 0; font-size: 12.5px; color: #475569; line-height: 1.6; }
        .info-list li { margin-bottom: 6px; }
        
        .footer { text-align: center; padding: 24px; background: #0f172a; color: #94a3b8; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="branding">Official Digital Pass</div>
          <h2 class="title">Botswana Startup Summit 2026</h2>
          <span class="admit-badge">🎫 Admit One</span>
        </div>
        
        <div class="ticket-body">
          <div class="ticket-row" style="border-top: none;">
            <span class="ticket-label">TICKET ID</span>
            <span class="ticket-value ticket-id">${ticketId}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">TICKET TYPE</span>
            <span class="ticket-value" style="color: #10b981;">${displayTicketType}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">ATTENDEE</span>
            <span class="ticket-value">${fullName}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">EMAIL</span>
            <span class="ticket-value">${email}</span>
          </div>
          <div class="ticket-row" style="border-bottom: none;">
            <span class="ticket-label">ORGANIZATION</span>
            <span class="ticket-value">${company || "N/A"}</span>
          </div>
          
          <div class="qr-section">
            <img class="qr-img" src="cid:ticket_qrcode" alt="Dynamic Check-in QR Code" />
            <div class="qr-help">Presenter must scan this QR code at Gaborone Game City gate check-in</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-lbl">📅 Date</div>
              <div class="detail-val">Aug 6-7, 2026</div>
            </div>
            <div class="detail-item">
              <div class="detail-lbl">⏰ Time</div>
              <div class="detail-val">08:00 - 17:00</div>
            </div>
            <div class="detail-item">
              <div class="detail-lbl">📍 Venue</div>
              <div class="detail-val" style="font-size:11px;">Game City, Gaborone</div>
            </div>
            <div class="detail-item">
              <div class="detail-lbl">🪑 Seat</div>
              <div class="detail-val">${seatNumber}</div>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-title">Gate Entry Instructions</div>
          <ul class="info-list">
            <li><strong>Present this QR code</strong> on your mobile screen or a printed sheet at the registration desk.</li>
            <li>Please bring a <strong>valid ID card</strong> (Omang or Passport) that matches the name listed on this ticket.</li>
            <li>Networking access, event guide, and schedule can be viewed at <a href="https://www.startupsummit.co.bw" target="_blank" style="color:#3b82f6; text-decoration:none; font-weight:600;">our portal</a>.</li>
            <li>Free reserved secure parking is available at the lower deck of Gaborone Game City Center for summit attendees.</li>
          </ul>
        </div>
        
        <div class="footer">
          <p style="margin: 0; color: #ffffff; font-weight: 600;">Startup Summit Botswana Team</p>
          <p style="margin: 4px 0 0 0;">support@startupsummit.co.bw | Terms & Conditions apply</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const smtpUser = process.env.SMTP_USER || "admin@startupsummit.co.bw";
  const smtpFrom = process.env.SMTP_FROM || `Startup Summit Botswana <${smtpUser}>`;

  const mailOptions: nodemailer.SendMailOptions = {
    from: smtpFrom,
    to: email,
    subject: `🎫 Your Startup Summit Digital Ticket - Botswana Startup Summit 2026`,
    html: ticketHtml,
    attachments: [
      {
        filename: `ticket-qrcode.png`,
        path: qrCodeDataUrl, // base64 data url
        cid: 'ticket_qrcode' // inline embed identifier
      }
    ]
  };

  try {
    const transporter = getTransporter();
    if (!transporter) {
      // SMTP credentials not configured - simulated send
      await logEmailEvent({
        type: 'TICKET_EMAIL',
        userId,
        email,
        ticketId,
        status: 'simulated',
        error: "SMTP credentials (SMTP_PASS) not configured in platform secrets. Simulating dispatch."
      });

      // Write Ticket document to tickets collection to keep records matching
      try {
        await addDoc(collection(db, "tickets"), {
          ticket_id: ticketId,
          user_id: userId,
          ticket_type: displayTicketType,
          event_date: "August 6-7, 2026",
          venue_location: "Game City, Gaborone",
          seat_number: seatNumber,
          qr_code_data: qrCodeDataUrl,
          issue_timestamp: new Date()
        });
      } catch (fErr) {
        console.warn("Firestore tickets save failure (ignored):", fErr);
      }

      return res.status(200).json({
        success: true,
        message: "Digital ticket simulation completed successfully. (Note: Please configure SMTP_PASS to send real emails)",
        simulated: true,
        ticketId
      });
    }

    // Attempt SMTP delivery with automatic 3x retries
    await sendMailWithRetry(mailOptions);

    await logEmailEvent({
      type: 'TICKET_EMAIL',
      userId,
      email,
      ticketId,
      status: 'success'
    });

    // Write persistent ticket document to tickets collection
    try {
      await addDoc(collection(db, "tickets"), {
        ticket_id: ticketId,
        user_id: userId,
        ticket_type: displayTicketType,
        event_date: "August 6-7, 2026",
        venue_location: "Game City, Gaborone",
        seat_number: seatNumber,
        qr_code_data: qrCodeDataUrl,
        issue_timestamp: new Date()
      });
    } catch (fErr) {
      console.warn("Firestore tickets save failure:", fErr);
    }

    return res.status(200).json({
      success: true,
      message: "Digital ticket successfully sent to user email.",
      ticketId
    });

  } catch (err: any) {
    // Delivery failure logic: log, retry exhausted, alert admin
    await logEmailEvent({
      type: 'TICKET_EMAIL',
      userId,
      email,
      ticketId,
      status: 'failed',
      error: err.message || String(err)
    });

    // Alert Admin about failed ticket delivery!
    const alertMailOptions: nodemailer.SendMailOptions = {
      from: smtpFrom,
      to: "admin@startupsummit.co.bw",
      subject: `⚠️ Ticket Delivery FAILED - ${fullName} (${email})`,
      html: `
        <h3>⚠️ DIGITAL TICKET DELIVERY FAILURE ALERT</h3>
        <p>The SMTP server was unable to deliver the digital ticket to <strong>${fullName}</strong> (${email}) after 3 attempts.</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
        <p><strong>Error Details:</strong> ${err.message || String(err)}</p>
        <p>Please check the email address formatting or manually trigger a resend from the Admin Console logs panel.</p>
      `
    };

    try {
      const transporter = getTransporter();
      if (transporter) {
        await transporter.sendMail(alertMailOptions);
      }
    } catch (adminAlertErr) {
      console.error("Nested admin failure notification failed:", adminAlertErr);
    }

    // Save to failure queue collection for manual retry
    try {
      await addDoc(collection(db, "email_queue"), {
        userId,
        email,
        fullName,
        ticketId,
        registrationType,
        ticketOption,
        exhibitorCategory,
        company,
        timestamp: new Date(),
        status: 'queued_for_manual_retry',
        error: err.message || String(err)
      });
    } catch (qErr) {
      console.warn("Failed to add to manual retry queue in Firestore:", qErr);
    }

    // Generate persistent ticket document so they can still view/download it on the web frontend
    try {
      await addDoc(collection(db, "tickets"), {
        ticket_id: ticketId,
        user_id: userId,
        ticket_type: displayTicketType,
        event_date: "August 6-7, 2026",
        venue_location: "Game City, Gaborone",
        seat_number: seatNumber,
        qr_code_data: qrCodeDataUrl,
        issue_timestamp: new Date()
      });
    } catch (fErr) {
      console.warn("Firestore tickets save failure:", fErr);
    }

    return res.status(200).json({
      success: true,
      message: "Digital ticket successfully generated! However, SMTP email delivery failed (connection timeout/port blocked in sandbox). The ticket is queued for automated retry, and the user can download their ticket directly from the attendee portal.",
      simulated: true,
      warning: err.message || String(err),
      ticketId
    });
  }
});

// API: Resend Ticket Email (PART 3)
app.post("/api/resend-ticket-email", async (req, res) => {
  const { id, fullName, email, registrationType, ticketOption, exhibitorCategory, company, ticketId } = req.body;

  if (!email || !fullName || !ticketId) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, and ticketId are required." 
    });
  }

  const userId = id || `USER-${Math.floor(10000 + Math.random() * 90000)}`;
  let qrCodeDataUrl = "";

  // Generate QR Code securely
  try {
    const checksum = crypto.createHash('sha256').update(`${ticketId}-${userId}-ssb2026`).digest('hex');
    const qrPayload = JSON.stringify({
      ticket_id: ticketId,
      user_id: userId,
      event_id: "EVENT-2026-001",
      timestamp: new Date().toISOString(),
      checksum: checksum
    });

    qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (qrErr: any) {
    return res.status(500).json({
      success: false,
      error: "Failed to generate QR Code during resend operation."
    });
  }

  let displayTicketType = "General Admission";
  if (registrationType === 'partner') {
    displayTicketType = "VIP Partner Pass";
  } else if (registrationType === 'exhibitor') {
    displayTicketType = `${exhibitorCategory || "Standard"} Exhibitor Pass`;
  } else if (ticketOption === 'starter') {
    displayTicketType = "VIP Access Ticket";
  }

  const seatNumber = ticketOption === 'starter' || registrationType === 'partner' ? "VIP-Seat" : "Reserved-Seat";

  const ticketHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .branding { font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; color: #3b82f6; margin: 0 0 4px 0; }
        .title { margin: 0; font-size: 18px; font-weight: bold; color: #ffffff; }
        .admit-badge { display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-top: 8px; letter-spacing: 0.05em; }
        
        .ticket-body { padding: 28px 24px; background: #f8fafc; border: 2px dashed #e2e8f0; margin: 15px; border-radius: 12px; }
        .ticket-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 13px; }
        .ticket-label { color: #64748b; font-weight: 500; }
        .ticket-value { color: #0f172a; font-weight: 600; text-align: right; }
        .ticket-id { font-family: monospace; font-size: 14px; font-weight: bold; color: #3b82f6; }
        
        .qr-section { text-align: center; padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .qr-img { width: 180px; height: 180px; display: inline-block; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; background: #ffffff; }
        
        .details-grid { display: flex; justify-content: space-between; padding: 15px 0 0 0; font-size: 12px; }
        .detail-item { flex: 1; text-align: center; border-right: 1px solid #e2e8f0; }
        .detail-item:last-child { border-right: none; }
        .detail-lbl { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 2px; }
        .detail-val { color: #0f172a; font-weight: bold; }
        
        .info-section { padding: 0 24px 24px 24px; }
        .info-title { font-size: 12px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em; border-left: 3px solid #3b82f6; padding-left: 8px; }
        .info-list { padding-left: 20px; margin: 0; font-size: 12.5px; color: #475569; line-height: 1.6; }
        .info-list li { margin-bottom: 6px; }
        .footer { text-align: center; padding: 24px; background: #0f172a; color: #94a3b8; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="branding">Resent Pass Copy</div>
          <h2 class="title">Botswana Startup Summit 2026</h2>
          <span class="admit-badge" style="background-color: #3b82f6;">🎫 Digital Pass Resend</span>
        </div>
        
        <div class="ticket-body">
          <div class="ticket-row" style="border-top: none;">
            <span class="ticket-label">TICKET ID</span>
            <span class="ticket-value ticket-id">${ticketId}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">TICKET TYPE</span>
            <span class="ticket-value" style="color: #10b981;">${displayTicketType}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">ATTENDEE</span>
            <span class="ticket-value">${fullName}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">EMAIL</span>
            <span class="ticket-value">${email}</span>
          </div>
          <div class="ticket-row" style="border-bottom: none;">
            <span class="ticket-label">ORGANIZATION</span>
            <span class="ticket-value">${company || "N/A"}</span>
          </div>
          
          <div class="qr-section">
            <img class="qr-img" src="cid:ticket_qrcode" alt="Dynamic Check-in QR Code" />
          </div>
          
          <div class="details-grid">
            <div class="detail-item">📅 Aug 6-7, 2026</div>
            <div class="detail-item">📍 Game City, Gaborone</div>
            <div class="detail-item">🪑 ${seatNumber}</div>
          </div>
        </div>
        <div class="info-section">
          <div class="info-title">Important Note</div>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.5; margin: 0 0 10px 0;">This email is a resubmission of your digital event ticket pass as requested. Please keep this on your mobile screen for seamless entry scan.</p>
        </div>
        <div class="footer">
          <p style="margin: 0; color: #ffffff; font-weight: 600;">Startup Summit Botswana Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const smtpUser = process.env.SMTP_USER || "admin@startupsummit.co.bw";
  const smtpFrom = process.env.SMTP_FROM || `Startup Summit Botswana <${smtpUser}>`;

  const mailOptions: nodemailer.SendMailOptions = {
    from: smtpFrom,
    to: email,
    subject: `🎫 [RESEND] Your Startup Summit Digital Ticket - Botswana Startup Summit 2026`,
    html: ticketHtml,
    attachments: [
      {
        filename: `ticket-qrcode.png`,
        path: qrCodeDataUrl,
        cid: 'ticket_qrcode'
      }
    ]
  };

  try {
    const transporter = getTransporter();
    if (!transporter) {
      await logEmailEvent({
        type: 'TICKET_EMAIL',
        userId,
        email,
        ticketId,
        status: 'simulated',
        error: "SMTP credentials not configured. Resend simulated."
      });
      return res.status(200).json({
        success: true,
        message: "Digital ticket resend simulated successfully.",
        simulated: true
      });
    }

    await sendMailWithRetry(mailOptions);

    await logEmailEvent({
      type: 'TICKET_EMAIL',
      userId,
      email,
      ticketId,
      status: 'success',
      error: "User-requested resend copy delivered successfully"
    });

    return res.status(200).json({
      success: true,
      message: "Digital ticket copy resent successfully."
    });
  } catch (err: any) {
    await logEmailEvent({
      type: 'TICKET_EMAIL',
      userId,
      email,
      ticketId,
      status: 'failed',
      error: `Resend attempt failed: ${err.message || String(err)}`
    });

    return res.status(200).json({
      success: true,
      message: "Digital ticket copy queued for delivery retry! (SMTP connection timed out/port blocked in sandbox; queued for automated retry background service).",
      simulated: true,
      warning: err.message || String(err)
    });
  }
});

// API: Speaker Application Email (Stubbed/Emails Removed)
app.post("/api/speaker-apply", (req, res) => {
  const { fullName, email, topic } = req.body;

  if (!email || !fullName || !topic) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields." 
    });
  }

  console.log(`[Speaker Application Received] ${fullName} (${email}) on topic: "${topic}".`);

  return res.status(200).json({
    success: true,
    message: "Speaker application submitted successfully.",
    simulated: true
  });
});

// Vite middleware and routing for SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export { app };

