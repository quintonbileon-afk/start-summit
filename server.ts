import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Send Registration Email
app.post("/api/send-registration-email", async (req, res) => {
  const { 
    fullName, 
    email, 
    company, 
    role, 
    registrationType, 
    ticketOption, 
    participantCategory,
    businessSector,
    exhibitorCategory,
    productsExhibited,
    partnershipCategory,
    partnershipInterest,
    origin
  } = req.body;

  if (!email || !fullName || !registrationType) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, or registrationType." 
    });
  }

  const cleanName = fullName.replace(/\s+/g, '').substring(0, 5).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `SSB26-${cleanName}-${randomSuffix}`;
  const qrData = JSON.stringify({ name: fullName, email, ticketId });
  const appOrigin = origin || 'https://www.startupsummit.co.bw';

  let subject = `Your Ticket for Startup Summit Botswana - ${fullName}`;
  let ticketTypeDisplay = '';
  let invoiceDescription = '';
  let price = 0;

  if (registrationType === 'attendant') {
    ticketTypeDisplay = ticketOption === 'standard' ? 'Standard Ticket' : 'Starter Pack';
    price = ticketOption === 'standard' ? 300 : 850;
    invoiceDescription = `Attendee Registration - ${ticketTypeDisplay}`;
  } else if (registrationType === 'exhibitor') {
    ticketTypeDisplay = exhibitorCategory ? exhibitorCategory.replace(/ – BWP.*/, '') : 'Exhibitor';
    invoiceDescription = `Exhibitor Space - ${ticketTypeDisplay}`;
    if (ticketTypeDisplay === 'SME EXHIBITOR') price = 1500;
    else if (ticketTypeDisplay === 'GOVERNMENT AGENCY') price = 30000;
    else if (ticketTypeDisplay === 'CORPORATE EXHIBITOR') price = 30000;
  } else if (registrationType === 'partner') {
    ticketTypeDisplay = partnershipCategory || 'Partner';
    subject = `Partnership Received - Startup Summit Botswana`;
  }

  const needsInvoice = price > 0;

  const ticketHtml = `
    <div style="background-color: #ffffff; color: #0f1b2b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-width: 448px; margin: 0 auto; position: relative; font-family: sans-serif; border: 1px solid #e5e7eb;">
      <div style="background-color: #0f1b2b; padding: 24px; text-align: center; color: white; position: relative;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(to right, #10B981, #FBBF24, #10B981);"></div>
        <img src="${appOrigin}/startup_summit_logo.png" alt="Logo" style="height: 48px; width: auto; margin-bottom: 12px; display: inline-block;" />
        <h3 style="font-weight: 700; font-size: 24px; margin: 0 0 4px 0; letter-spacing: -0.025em;">START-UP SUMMIT</h3>
        <p style="color: #10B981; font-weight: 600; font-size: 12px; letter-spacing: 0.1em; margin: 0;">BOTSWANA 2026</p>
      </div>
      <div style="border-top: 2px dashed #e5e7eb; margin: 4px 24px 0 24px;"></div>
      <div style="padding: 32px 32px 40px 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; padding: 12px; background-color: white; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 16px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}" alt="QR Code" width="160" height="160" />
          </div>
          <p style="font-size: 12px; color: #9ca3af; font-family: monospace; margin: 0;">${ticketId}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin: 0 0 4px 0;">Attendee</p>
          <p style="font-weight: 700; font-size: 18px; margin: 0; color: #111827;">${fullName}</p>
        </div>
        <div style="margin-bottom: 24px;">
          <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin: 0 0 4px 0;">Role / Organization</p>
          <p style="font-weight: 500; color: #374151; margin: 0 0 4px 0;">${role || 'Participant'} at ${company || 'N/A'}</p>
          <div style="margin-top: 4px;">
            <span style="font-size: 12px; color: #10B981; font-weight: 600; text-transform: uppercase;">${registrationType}</span>
            ${ticketTypeDisplay ? `<span style="font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; margin: 0 4px;">•</span><span style="font-size: 12px; color: #FBBF24; font-weight: 600; text-transform: uppercase;">${ticketTypeDisplay}</span>` : ''}
          </div>
        </div>
        <div style="border-top: 1px solid #f3f4f6; margin-top: 24px; padding-top: 24px;">
          <table style="width: 100%; border: 0;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin: 0 0 4px 0;">Date</p>
                <p style="font-weight: 500; font-size: 14px; margin: 0; color: #111827;">Aug 7, 2026</p>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin: 0 0 4px 0;">Venue</p>
                <p style="font-weight: 500; font-size: 14px; margin: 0; color: #111827;">Game City Center</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

  const invoiceHtml = needsInvoice ? `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 40px; max-width: 600px; margin: 40px auto 0 auto; font-family: sans-serif; color: #374151; border-radius: 8px;">
      <table style="width: 100%; margin-bottom: 40px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: top;">
            <img src="${appOrigin}/startup_summit_logo.png" alt="Logo" style="height: 40px; width: auto; margin-bottom: 8px;" />
            <h2 style="margin: 0; color: #111827; font-size: 20px;">Startup Summit Botswana</h2>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Game City Center, Gaborone</p>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <h1 style="margin: 0; color: #111827; font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">Proforma Invoice</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Invoice No:</strong> INV-${ticketId}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </td>
        </tr>
      </table>
      
      <div style="margin-bottom: 40px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Bill To:</p>
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #111827; font-size: 16px;">${fullName}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px;">${company || 'N/A'}</p>
        <p style="margin: 0; font-size: 14px;">${email}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px 0; text-align: left; font-size: 14px; color: #6b7280; text-transform: uppercase;">Description</th>
            <th style="padding: 12px 0; text-align: right; font-size: 14px; color: #6b7280; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px 0; font-size: 15px; color: #111827;">${invoiceDescription}</td>
            <td style="padding: 16px 0; text-align: right; font-size: 15px; color: #111827; font-weight: 500;">BWP ${price.toLocaleString()}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td style="padding: 16px 0; text-align: right; font-size: 15px; font-weight: bold; color: #111827;">Total Due:</td>
            <td style="padding: 16px 0; text-align: right; font-size: 18px; font-weight: bold; color: #10B981;">BWP ${price.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; font-size: 14px; color: #4b5563;">
        <p style="margin: 0 0 12px 0; font-weight: bold; color: #111827;">Payment Instructions:</p>
        <p style="margin: 0 0 4px 0;">Please transfer the total amount due to the following bank account to confirm your registration.</p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li><strong>Bank:</strong> FNB Botswana</li>
          <li><strong>Account Name:</strong> Startup Summit BW</li>
          <li><strong>Account Number:</strong> 62000000000</li>
          <li><strong>Branch Code:</strong> 281467</li>
          <li><strong>Reference:</strong> ${ticketId}</li>
        </ul>
      </div>
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Startup Summit Botswana - Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <p style="margin-bottom: 24px; color: #4b5563; font-size: 16px;">Hello ${fullName}, thank you for registering for the <strong>Startup Summit Botswana</strong>.</p>
            ${ticketHtml}
            ${invoiceHtml}
            <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>&copy; 2026 Startup Summit Botswana. All rights reserved.</p>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "Startup Summit Botswana <noreply@startupsummit.bw>";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("----------------------------------------");
    console.log("📨 STUBBED EMAIL DISPATCH:");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Price: BWP ${price}`);
    console.log("----------------------------------------");
    
    return res.status(200).json({
      success: true,
      message: "Email dispatch simulation completed.",
      simulated: true
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    const adminMailOptions = {
      from: smtpFrom,
      to: "admin@startupsummit.co.bw",
      subject: `New Registration Alert - ${registrationType.toUpperCase()}: ${fullName}`,
      html: `
        <h2>New Registration Received</h2>
        <p>A new user has registered for the Startup Summit.</p>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Type:</strong> ${registrationType}</p>
        <p><strong>Company:</strong> ${company || 'N/A'}</p>
        <p><strong>Role:</strong> ${role || 'N/A'}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully dispatched to ${email}. Message ID: ${info.messageId}`);
    
    try {
      const adminInfo = await transporter.sendMail(adminMailOptions);
      console.log(`Admin notification dispatched to admin@startupsummit.co.bw. Message ID: ${adminInfo.messageId}`);
    } catch (adminError) {
      console.error("Error sending admin notification:", adminError);
    }
    
    return res.status(200).json({
      success: true,
      message: `Confirmation email dispatched successfully to ${email}.`,
      messageId: info.messageId
    });
  } catch (error: any) {
    console.error("Nodemailer error sending email:", error);
    return res.status(500).json({
      success: false,
      error: "The email server encountered an issue.",
      details: error.message
    });
  }
});

// API: Speaker Application Email
app.post("/api/speaker-apply", async (req, res) => {
  const { fullName, email, role, company, topic, bio } = req.body;

  if (!email || !fullName || !topic) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields." 
    });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "Startup Summit Botswana <admin@startupsummit.co.bw>";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("----------------------------------------");
    console.log("📨 STUBBED EMAIL DISPATCH (SMTP credentials not configured):");
    console.log(`Speaker Application from: ${fullName} <${email}>`);
    console.log(`Topic: ${topic}`);
    console.log("----------------------------------------");
    return res.status(200).json({ success: true, simulated: true });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const adminMailOptions = {
      from: smtpFrom,
      to: "admin@startupsummit.co.bw",
      subject: `New Speaker Application: ${fullName}`,
      html: `
        <h2>New Speaker Application Received</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; font-weight: bold;">Name:</td><td>${fullName}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${email}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Role:</td><td>${role}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Company:</td><td>${company}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Topic:</td><td>${topic}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Bio:</td><td>${bio}</td></tr>
        </table>
      `,
    };

    await transporter.sendMail(adminMailOptions);
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Nodemailer error:", error);
    return res.status(500).json({ success: false, error: "Failed to send application." });
  }
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
