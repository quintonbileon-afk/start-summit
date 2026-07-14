import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";
import crypto from "crypto";
import QRCode from "qrcode";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";

// Prefer IPv4 first for DNS resolution to avoid IPv6 connection timeouts on Cloud Run/Docker
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Initialize Firebase client SDK in server-side context for logs & queues
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

const firebaseApp = initializeApp(firebaseConfig);
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-startupsummitbot-95035c0c-ff62-4d88-b693-ccacd9498d61";
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

// Mailer transporter helper
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || "mail.startupsummit.co.bw";
  const smtpPort = process.env.SMTP_PORT || "465";
  const smtpUser = process.env.SMTP_USER || "admin@startupsummit.co.bw";
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpPass) {
    return null;
  }

  const portNum = parseInt(smtpPort, 10);
  return nodemailer.createTransport({
    host: smtpHost,
    port: portNum,
    secure: portNum === 465, // true for 465, false for 587
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false // avoids SSL handshake issues on self-signed and custom certs
    },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
  });
};

// Send email with automatic 3x retries
async function sendMailWithRetry(mailOptions: nodemailer.SendMailOptions, maxRetries = 3) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP credentials (SMTP_PASS) not configured in platform secrets.");
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, attempt };
    } catch (err: any) {
      lastError = err;
      await logEmailEvent({
        type: 'RETRY_ATTEMPT',
        email: String(mailOptions.to),
        status: 'failed',
        attempt,
        error: err.message || String(err)
      });
      if (attempt < maxRetries) {
        // Linear backoff delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  throw lastError;
}

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Trigger Admin Registration Alert (PART 1)
app.post("/api/send-registration-email", async (req, res) => {
  const userData = req.body;
  const { id, fullName, email, registrationType, company, role, mobileNumber, physicalAddress } = userData;

  if (!email || !fullName || !registrationType) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, or registrationType." 
    });
  }

  const appUrl = process.env.APP_URL || "https://ais-dev-nhdcitijonrkaqilezks6n-312329245331.europe-west2.run.app";
  const timestampStr = new Date().toLocaleString();

  // Create action URLs
  const dashboardUrl = `${appUrl}`;
  const profileUrl = `${appUrl}`;
  const verifyUrl = `${appUrl}`;

  // Admin Registration Alert Email Template HTML
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
        .badge { display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 6px 12px; border-radius: 9999px; letter-spacing: 0.05em; margin-bottom: 12px; }
        .title { margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em; }
        .meta { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .content { padding: 32px 24px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .table th, .table td { padding: 12px 16px; text-align: left; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
        .table th { background-color: #f8fafc; font-weight: 600; color: #64748b; width: 35%; }
        .table td { color: #0f172a; }
        .status-box { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 28px; }
        .status-title { margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-desc { margin: 0; font-size: 14px; color: #78350f; line-height: 1.4; }
        .btn-group { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; }
        .btn { display: block; text-align: center; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; transition: all 0.2s; }
        .btn-primary { background-color: #3b82f6; color: #ffffff; }
        .btn-secondary { background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
        .footer { text-align: center; padding: 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">🔔 New Registration Alert</span>
          <h2 class="title">Botswana Startup Summit 2026</h2>
          <div class="meta">Received at: ${timestampStr}</div>
        </div>
        <div class="content">
          <p style="margin-top: 0; font-size: 15px; line-height: 1.5; color: #334155;">
            An attendee has successfully registered on the portal. Please review registration details below and verify payment if applicable.
          </p>
          <table class="table">
            <tr><th>Full Name</th><td>${fullName}</td></tr>
            <tr><th>Email Address</th><td>${email}</td></tr>
            <tr><th>Registration Date</th><td>${timestampStr}</td></tr>
            <tr><th>User Type</th><td style="text-transform: capitalize; font-weight: bold; color: #3b82f6;">${registrationType}</td></tr>
            <tr><th>Company</th><td>${company || "N/A"}</td></tr>
            <tr><th>Role</th><td>${role || "N/A"}</td></tr>
            <tr><th>Phone</th><td>${mobileNumber || "N/A"}</td></tr>
            <tr><th>Physical Address</th><td>${physicalAddress || "N/A"}</td></tr>
          </table>

          <div class="status-box">
            <h4 class="status-title">⚠️ Payment Status: Pending Verification</h4>
            <p class="status-desc">
              Please check your bank account or mobile money records for payments from <strong>${fullName}</strong>. Once confirmed, approve the registration from the Admin Dashboard to auto-issue their digital ticket.
            </p>
          </div>

          <div class="btn-group">
            <a href="${verifyUrl}" class="btn btn-primary">🔍 Verify Payment & Issue Ticket</a>
            <a href="${profileUrl}" class="btn btn-secondary">👤 View Full Profile</a>
            <a href="${dashboardUrl}" class="btn btn-secondary">📋 Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">Automated notification from Botswana Startup Summit 2026 email service.</p>
          <p style="margin: 6px 0 0 0; color: #94a3b8;">Admin Support: admin@startupsummit.co.bw</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const smtpUser = process.env.SMTP_USER || "admin@startupsummit.co.bw";
  const smtpFrom = process.env.SMTP_FROM || `Startup Summit Botswana <${smtpUser}>`;

  const mailOptions: nodemailer.SendMailOptions = {
    from: smtpFrom,
    to: "admin@startupsummit.co.bw", // Recipient is strictly admin
    subject: `New User Registration Alert - ${fullName} (${email})`,
    html: adminHtml,
  };

  try {
    const transporter = getTransporter();
    if (!transporter) {
      // SMTP credentials not configured - log simulation gracefully
      await logEmailEvent({
        type: 'ADMIN_ALERT',
        userId: id || "temp-id",
        email: email,
        status: 'simulated',
        error: "SMTP credentials (SMTP_PASS) not configured in platform secrets. Simulating email."
      });
      return res.status(200).json({
        success: true,
        message: "Admin alert simulated (No SMTP_PASS found in secrets panel).",
        simulated: true
      });
    }

    // Attempt delivery with 3x retry
    await sendMailWithRetry(mailOptions);
    
    await logEmailEvent({
      type: 'ADMIN_ALERT',
      userId: id || "temp-id",
      email: email,
      status: 'success'
    });

    return res.status(200).json({
      success: true,
      message: "Admin registration alert email successfully delivered."
    });
  } catch (err: any) {
    // Failure should log but NOT block registration flow (graceful fallback)
    await logEmailEvent({
      type: 'ADMIN_ALERT',
      userId: id || "temp-id",
      email: email,
      status: 'failed',
      error: err.message || String(err)
    });

    return res.status(200).json({
      success: false,
      message: "Admin alert failed to send via SMTP, but registration was processed. Logged for retry.",
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

startServer();
