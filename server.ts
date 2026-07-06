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
    partnershipInterest
  } = req.body;

  if (!email || !fullName || !registrationType) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: email, fullName, or registrationType." 
    });
  }

  // Choose subject & custom template based on registration type
  let subject = "Startup Summit Botswana - Registration Confirmation";
  let greetingTitle = "Registration Confirmed!";
  let detailsHtml = "";
  let roleSpecificInstructions = "";

  const themeColor = "#111827"; // Dark professional brand color matching deep slate
  const accentColor = "#10B981"; // Vibrant green matching accent

  if (registrationType === 'attendant') {
    subject = `Your Ticket for Startup Summit Botswana - ${fullName}`;
    greetingTitle = "Your Startup Summit Ticket is Confirmed!";
    detailsHtml = `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${themeColor};">Registration Details:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Participant:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Company/Org:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${company || "Individual"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Role:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${role || "Participant"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Category:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827; text-transform: capitalize;">${participantCategory || "Standard Attendant"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Ticket Tier:</td>
            <td style="padding: 6px 0; text-align: right; color: ${accentColor}; font-weight: bold; text-transform: uppercase;">${ticketOption || "Standard"}</td>
          </tr>
        </table>
      </div>
    `;
    roleSpecificInstructions = `
      <p style="margin-top: 0; margin-bottom: 12px;">We are thrilled to welcome you as an attendee. The summit is packed with keynote presentations, interactive panels, startup pitch competitions, and high-value networking opportunities.</p>
      <p style="margin-bottom: 0;"><strong>What's Next?</strong> Your registration badge will be prepared and ready for pickup at the registration desk on the morning of the summit. Please keep this confirmation email handy (either printed or on your phone) for seamless check-in.</p>
    `;
  } else if (registrationType === 'exhibitor') {
    subject = `Exhibitor Space Secured - Startup Summit Botswana`;
    greetingTitle = "Your Exhibitor Application is Confirmed!";
    detailsHtml = `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${themeColor};">Exhibitor Profile:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Company Name:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Primary Contact:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Exhibitor Category:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827; text-transform: capitalize;">${exhibitorCategory || "General"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Business Sector:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${businessSector || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Showcase Offerings:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${productsExhibited || "N/A"}</td>
          </tr>
        </table>
      </div>
    `;
    roleSpecificInstructions = `
      <p style="margin-top: 0; margin-bottom: 12px;">Thank you for registering to showcase your innovative solutions. Having your brand represented at Startup Summit Botswana will put you directly in front of leading investors, industry experts, and potential partners.</p>
      <p style="margin-bottom: 0;"><strong>What's Next?</strong> Our Exhibitor Relations Team will send you a comprehensive Exhibitor Kit in the coming days. This kit contains setup guidelines, booth layout configurations, shipping directions, and event-day scheduling details.</p>
    `;
  } else if (registrationType === 'partner') {
    subject = `Partnership & Sponsorship Received - Startup Summit Botswana`;
    greetingTitle = "Thank You for Partnering with Us!";
    detailsHtml = `
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${themeColor};">Partnership Profile:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Partner Organization:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Lead Contact:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${fullName} (${role || "Representative"})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Partnership Category:</td>
            <td style="padding: 6px 0; text-align: right; color: ${accentColor}; font-weight: bold; text-transform: capitalize;">${partnershipCategory || "Partner/Sponsor"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500;">Area of Interest:</td>
            <td style="padding: 6px 0; text-align: right; color: #111827;">${partnershipInterest || "General Collaboration"}</td>
          </tr>
        </table>
      </div>
    `;
    roleSpecificInstructions = `
      <p style="margin-top: 0; margin-bottom: 12px;">We are deeply honored to have your organization partner with Startup Summit Botswana. Your support is instrumental in driving the growth, resilience, and transformation of Botswana's startup ecosystem.</p>
      <p style="margin-bottom: 0;"><strong>What's Next?</strong> A senior member of our organizing committee will reach out to you within 24–48 hours to discuss custom sponsorship benefits, brand placements, speaking slots, and finalize our partnership roadmap.</p>
    `;
  }

  // Create the final HTML structure for the email
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Header Banner -->
        <tr>
          <td style="background-color: ${themeColor}; padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">STARTUP SUMMIT</h1>
            <p style="color: ${accentColor}; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Botswana</p>
          </td>
        </tr>
        
        <!-- Email Body -->
        <tr>
          <td style="padding: 40px; color: #374151; line-height: 1.6;">
            <h2 style="color: ${themeColor}; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700;">Hello ${fullName},</h2>
            <p style="margin-top: 0; margin-bottom: 24px; font-size: 16px;">
              Thank you for registering for the <strong>Startup Summit Botswana</strong>. We have successfully received your registration details.
            </p>
            
            <!-- Greeting Banner -->
            <div style="border-left: 4px solid ${accentColor}; padding: 12px 16px; background-color: #f0fdf4; margin-bottom: 24px;">
              <p style="margin: 0; font-weight: 600; color: #166534; font-size: 15px;">${greetingTitle}</p>
            </div>

            <!-- Custom Details block -->
            ${detailsHtml}

            <!-- Role specific info -->
            <div style="font-size: 15px; margin-bottom: 30px;">
              ${roleSpecificInstructions}
            </div>

            <!-- Footer divider -->
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <!-- Event Details Callout -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Date & Time</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">To Be Announced</p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">Gaborone, Botswana</p>
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 15px; border-left: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Venue</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">Gaborone, Botswana</p>
                  <p style="margin: 0; font-size: 13px; color: #6b7280;">Physical & Virtual Access</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Email Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #9ca3af;">
              This is an automated confirmation email regarding your registration at Startup Summit Botswana.
            </p>
            <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
              &copy; 2026 Startup Summit Botswana. All rights reserved.
            </p>
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

  // If credentials are not configured, print to logs gracefully and succeed with a descriptive message
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("----------------------------------------");
    console.log("📨 STUBBED EMAIL DISPATCH (SMTP credentials not configured in environment):");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`FullName: ${fullName}`);
    console.log(`Type: ${registrationType}`);
    console.log("----------------------------------------");
    
    return res.status(200).json({
      success: true,
      message: "Email dispatch simulation completed. (To send real emails, please define SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS secrets in the AI Studio settings panel).",
      simulated: true
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || "587", 10),
      secure: smtpPort === "465", // true for 465, false for other ports
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
        ${detailsHtml}
        <p><strong>Email:</strong> ${email}</p>
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
      error: "The email server encountered an issue while trying to send the notification.",
      details: error.message
    });
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
