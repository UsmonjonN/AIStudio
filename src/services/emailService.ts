import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Email configuration interface
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD, // Gmail App Password
    },
  };

  // Verify configuration
  if (!config.auth.user || !config.auth.pass) {
    console.warn("⚠️ SMTP credentials not configured. Email functionality will not work.");
    console.warn("Please set SMTP_USER and SMTP_PASSWORD in your .env file");
    return null;
  }

  return nodemailer.createTransport(config);
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error("Email transporter not configured");
      return false;
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'AI Studio App'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

// Send welcome email template
export const sendWelcomeEmail = async (email: string, ideaSummary: string): Promise<boolean> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .idea-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Your Idea Summary</h1>
          <p>Thank you for sharing your vision with SRP!</p>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>We've captured your software idea, and we're excited about the potential. Here's a quick summary of what we discussed:</p>
          
          <div class="idea-box">
            <h3>💡 Your Concept:</h3>
            <p>${ideaSummary}</p>
          </div>
          
          <p>Our team will review this and prepare a visual concept along with technical recommendations for you.</p>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>We'll email you a prototype visualization within 24-48 hours</li>
            <li>A senior consultant will reach out to discuss implementation</li>
            <li>You'll receive a no-obligation proposal with timeline and cost</li>
          </ul>
          
          <center>
            <a href="#" class="button">Schedule a Consultation</a>
          </center>
          
          <div class="footer">
            <p>Silk Road Professionals (SRP)<br>
            Transforming Ideas into Reality</p>
            <p style="font-size: 12px; color: #999;">This is an automated message from our AI Idea-to-MVP Engine</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Your Idea Summary

Thank you for sharing your vision with SRP!

YOUR CONCEPT:
${ideaSummary}

WHAT'S NEXT?
- We'll email you a prototype visualization within 24-48 hours
- A senior consultant will reach out to discuss implementation
- You'll receive a no-obligation proposal with timeline and cost

---
Silk Road Professionals (SRP)
Transforming Ideas into Reality
  `;

  return sendEmail({
    to: email,
    subject: "✨ Your SRP Idea Summary & Next Steps",
    text: textContent,
    html: htmlContent,
  });
};

// Send notification to admin
export const sendAdminNotification = async (
  userEmail: string, 
  ideaSummary: string, 
  conversationData: any
): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  if (!adminEmail) {
    console.warn("No admin email configured");
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; }
        .label { font-weight: bold; color: #2c3e50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 New Lead from AI Advisor</h2>
        </div>
        <div class="content">
          <div class="info-box">
            <p><span class="label">User Email:</span> ${userEmail}</p>
            <p><span class="label">Date:</span> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="info-box">
            <h3>💡 Idea Summary:</h3>
            <p>${ideaSummary}</p>
          </div>
          
          <div class="info-box">
            <h3>📊 Conversation Data:</h3>
            <pre>${JSON.stringify(conversationData, null, 2)}</pre>
          </div>
          
          <p><strong>Action Required:</strong> Follow up with this lead within 24 hours.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🎯 New Lead: ${userEmail}`,
    html: htmlContent,
    text: `New Lead from AI Advisor\n\nUser: ${userEmail}\nIdea: ${ideaSummary}`,
  });
};

// Test email configuration
export const testEmailConfiguration = async (): Promise<boolean> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready to take our messages");
    return true;
  } catch (error) {
    console.error("❌ SMTP configuration error:", error);
    return false;
  }
};
