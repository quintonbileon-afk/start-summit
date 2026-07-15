import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
  console.error('[EmailService] Error loading .env override:', err);
}

dotenv.config();

// Create primary transporter (Custom Domain)
const primaryTransporter = nodemailer.createTransport({
  host: process.env.PRIMARY_SMTP_HOST || 'mail.startupsummit.co.bw',
  port: parseInt(process.env.PRIMARY_SMTP_PORT || '465', 10),
  secure: process.env.PRIMARY_SMTP_SECURE === 'true' || process.env.PRIMARY_SMTP_PORT === '465',
  auth: {
    user: process.env.PRIMARY_SMTP_USER || 'admin@startupsummit.co.bw',
    pass: process.env.PRIMARY_SMTP_PASS || '@St@rtu9@26',
  },
  tls: {
    rejectUnauthorized: false // avoids SSL handshake issues on self-signed/custom certs
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

// Create fallback transporter (Gmail)
const fallbackTransporter = nodemailer.createTransport({
  host: process.env.FALLBACK_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.FALLBACK_SMTP_PORT || '587', 10),
  secure: process.env.FALLBACK_SMTP_SECURE === 'true',
  auth: {
    user: process.env.FALLBACK_SMTP_USER || 'quintonbileon@gmail.com',
    pass: process.env.FALLBACK_SMTP_PASS || 'vris ycyx fdsi hyoj',
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

/**
 * Robust email sender helper that attempts primary, then falls back to Gmail.
 */
export async function sendEmailWithFallback(
  mailOptions: nodemailer.SendMailOptions
): Promise<{ success: boolean; method: 'primary' | 'fallback'; messageId?: string }> {
  
  // Ensure "from" is always admin@startupsummit.co.bw as requested
  const fromEmail = 'admin@startupsummit.co.bw';
  const fromName = 'Startup Summit Botswana';
  mailOptions.from = `"${fromName}" <${fromEmail}>`;

  console.log(`[EmailService] Attempting to send email to ${mailOptions.to}...`);

  // 1. Try Primary SMTP (Custom Domain)
  try {
    console.log(`[EmailService] [Primary Method] Attempting via custom domain SMTP (${process.env.PRIMARY_SMTP_HOST || 'mail.startupsummit.co.bw'})...`);
    const info = await primaryTransporter.sendMail(mailOptions);
    console.log(`[EmailService] [Primary SUCCESS] Delivered successfully! Message ID: ${info.messageId}`);
    return { success: true, method: 'primary', messageId: info.messageId };
  } catch (primaryError: any) {
    console.warn(`[EmailService] [Primary FAILED] Custom domain SMTP error: ${primaryError.message || primaryError}`);
    
    // 2. Try Fallback SMTP (Gmail)
    try {
      console.log(`[EmailService] [Fallback Method] Attempting via Gmail SMTP (${process.env.FALLBACK_SMTP_HOST || 'smtp.gmail.com'})...`);
      const info = await fallbackTransporter.sendMail(mailOptions);
      console.log(`[EmailService] [Fallback SUCCESS] Delivered successfully via Gmail! Message ID: ${info.messageId}`);
      return { success: true, method: 'fallback', messageId: info.messageId };
    } catch (fallbackError: any) {
      console.error(`[EmailService] [FATAL] Both Primary and Fallback SMTP methods failed.`);
      console.error(`[EmailService] Fallback error details: ${fallbackError.message || fallbackError}`);
      throw new Error(`All SMTP Transports failed. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}`);
    }
  }
}

/**
 * Sends a welcome/registration confirmation email to the user with the responsive image-matching design.
 * @param userEmail 
 * @param userName 
 * @param regData Optional registration metadata
 */
export async function sendRegistrationEmail(
  userEmail: string, 
  userName: string,
  regData?: {
    company?: string;
    role?: string;
    registrationType?: string;
    participantCategory?: string;
    ticketOption?: string;
  }
): Promise<{ success: boolean; method?: 'primary' | 'fallback'; messageId?: string }> {
  console.log(`[EmailService] Preparing welcome registration email for ${userEmail} (${userName})...`);
  
  const company = regData?.company || 'Individual';
  const role = regData?.role || 'Attendee';
  
  // Category mapping
  let category = regData?.participantCategory || '';
  if (!category) {
    if (regData?.registrationType === 'exhibitor') {
      category = 'Exhibitor';
    } else if (regData?.registrationType === 'partner') {
      category = 'Partner';
    } else {
      category = 'General Attendee';
    }
  }

  // Ticket Tier styling
  const rawTicket = regData?.ticketOption || 'standard';
  const ticketOptionUpper = rawTicket.toUpperCase();
  let ticketTierStyledText = ticketOptionUpper;
  let ticketColor = '#10b981'; // Default green for standard

  if (rawTicket === 'starter') {
    ticketTierStyledText = 'STARTER PACK';
    ticketColor = '#ffb703'; // yellow/amber
  } else if (regData?.registrationType === 'partner') {
    ticketTierStyledText = 'PARTNER PASS';
    ticketColor = '#3b82f6'; // blue
  } else if (regData?.registrationType === 'exhibitor') {
    ticketTierStyledText = 'EXHIBITOR PASS';
    ticketColor = '#8b5cf6'; // purple
  }

  const mailOptions: nodemailer.SendMailOptions = {
    to: userEmail,
    subject: 'Welcome to Botswana Startup Summit 2026',
    html: `
      <div style="background-color: #f8fafc; padding: 40px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%; width: 100%; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 27, 43, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- HEADER -->
          <div style="background-color: #0F1B2B; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; font-family: Arial, sans-serif; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 0.06em; text-transform: uppercase;">STARTUP SUMMIT</h1>
            <p style="color: #10b981; font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; margin: 4px 0 0 0; letter-spacing: 0.18em; text-transform: uppercase;">BOTSWANA</p>
          </div>

          <!-- CONTENT BODY -->
          <div style="padding: 40px 32px; background-color: #ffffff;">
            
            <!-- GREETING -->
            <h2 style="font-family: Arial, sans-serif; font-size: 20px; font-weight: 700; color: #0F1B2B; margin-top: 0; margin-bottom: 16px;">Hello ${userName},</h2>
            
            <!-- INTRO -->
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
              Thank you for registering for the <strong>Startup Summit Botswana</strong>. We have successfully received your registration details.
            </p>

            <!-- GREEN STATUS BANNER -->
            <div style="border-left: 4px solid #10b981; background-color: #f0fdf4; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
              <h3 style="color: #15803d; font-size: 15px; font-weight: 700; margin: 0; font-family: Arial, sans-serif;">Your Startup Summit Ticket is Confirmed!</h3>
            </div>

            <!-- DETAILS BOX -->
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; background-color: #ffffff; margin-bottom: 28px;">
              <h4 style="font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-top: 0; margin-bottom: 16px; letter-spacing: 0.05em;">Registration Details:</h4>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9; width: 40%;">Participant:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #0F1B2B; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Company/Org:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #0F1B2B; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${company}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Role:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #0F1B2B; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${role}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Category:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #0F1B2B; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">Ticket Tier:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: ${ticketColor}; font-weight: 700; text-align: right; text-transform: uppercase;">${ticketTierStyledText}</td>
                </tr>
              </table>
            </div>

            <!-- MID TEXTS -->
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
              We are thrilled to welcome you as an attendee. The summit is packed with keynote presentations, interactive panels, startup pitch competitions, and high-value networking opportunities.
            </p>
            
            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 0; margin-bottom: 0;">
              <strong>What's Next?</strong> Your registration badge will be prepared and ready for pickup at the registration desk on the morning of the summit. Please keep this confirmation email handy (either printed or on your phone) for seamless check-in.
            </p>

            <!-- SEPARATOR -->
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

            <!-- METADATA COLUMNS (DATE/TIME & VENUE) -->
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding-right: 20px; vertical-align: top; border-right: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">DATE & TIME</div>
                  <div style="font-size: 15px; font-weight: 700; color: #0F1B2B;">To Be Announced</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Gaborone, Botswana</div>
                </td>
                <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                  <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">VENUE</div>
                  <div style="font-size: 15px; font-weight: 700; color: #0F1B2B;">Gaborone, Botswana</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Physical & Virtual Access</div>
                </td>
              </tr>
            </table>

          </div>

          <!-- FOOTER -->
          <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0 0 8px 0;">
              This is an automated confirmation email regarding your registration at Startup Summit Botswana.
            </p>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0;">
              © 2026 Startup Summit Botswana. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    `
  };

  return sendEmailWithFallback(mailOptions);
}

/**
 * Sends a notification email to the admin
 * @param userEmail 
 * @param userName 
 */
export async function notifyAdmin(
  userEmail: string, 
  userName: string
): Promise<{ success: boolean; method?: 'primary' | 'fallback'; messageId?: string }> {
  console.log(`[EmailService] Preparing admin notification for registration: ${userEmail} (${userName})...`);
  
  const mailOptions: nodemailer.SendMailOptions = {
    to: process.env.ADMIN_EMAIL || 'admin@startupsummit.co.bw',
    subject: `🚨 New Registration Alert: ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">New Registration Notification</h2>
        <p>Hello Admin,</p>
        <p>A new registration has been received on the Botswana Startup Summit platform:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0; width: 30%;">Name</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${userName}</strong></td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Email</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><a href="mailto:${userEmail}">${userEmail}</a></td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Registration Date</th>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        <p>Please log in to the admin console dashboard to review payment details and approve this registration.</p>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          <p>This is an automated notification sent from Botswana Startup Summit 2026.</p>
        </div>
      </div>
    `
  };

  return sendEmailWithFallback(mailOptions);
}
