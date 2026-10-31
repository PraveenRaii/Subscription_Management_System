import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter) return transporter;

  try {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const smtpHost = process.env.SMTP_HOST || '';
    const isGmail =
      process.env.EMAIL_SERVICE === 'gmail' ||
      smtpHost.toLowerCase().includes('gmail') ||
      smtpUser?.toLowerCase().includes('@gmail.com');

    // Check if user has provided real credentials (not empty, not demo)
    const isRealCredentials =
      Boolean(smtpUser) &&
      Boolean(smtpPass) &&
      !smtpUser?.includes('demo.com') &&
      !smtpPass?.includes('demo_pass');

    if (isRealCredentials) {
      if (isGmail) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`[Email Service] Connected to Gmail SMTP for ${smtpUser}`);
      } else {
        transporter = nodemailer.createTransport({
          host: smtpHost || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`[Email Service] Connected to Custom SMTP (${smtpHost}:${process.env.SMTP_PORT || 587})`);
      }
    } else {
      console.log('[Email Service] Real SMTP credentials (Gmail / SMTP_USER) not yet set in server/.env.');
    }
  } catch (err: any) {
    console.warn('Nodemailer init notice:', err.message);
  }

  return transporter;
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<{ sent: boolean; reason?: string }> {
  try {
    const mailer = await getTransporter();

    if (!mailer) {
      console.log(`\n======================================================`);
      console.log(`🔑 [VERIFICATION OTP FOR ${to}]: ${otp}`);
      console.log(`📌 To deliver OTP directly to user's real email inbox,`);
      console.log(`   configure SMTP_USER & SMTP_PASS (Gmail App Password) in server/.env`);
      console.log(`======================================================\n`);
      return { sent: false, reason: 'SMTP credentials not configured in server/.env' };
    }

    const fromAddress =
      process.env.FROM_EMAIL || `"Billflow Security" <${process.env.SMTP_USER || 'security@billflow.io'}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: `Your Billflow 2.0 Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #fed7aa; border-radius: 12px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.08);">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="background: #f97316; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; line-height: 36px; text-align: center;">B</div>
            <span style="font-size: 20px; font-weight: bold; color: #18181b; margin-left: 10px;">Billflow 2.0</span>
          </div>
          <h2 style="color: #ea580c; font-size: 22px; margin-top: 0; margin-bottom: 12px;">Verify Your Email Address</h2>
          <p style="color: #3f3f46; font-size: 15px; line-height: 1.5;">Hello <strong>${name}</strong>,</p>
          <p style="color: #52525b; font-size: 14px; line-height: 1.5;">Thank you for registering with Billflow 2.0. Please use the following 6-digit One-Time Password (OTP) to complete your account registration and verify your email address:</p>
          
          <div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #c2410c; font-family: 'Courier New', monospace;">${otp}</span>
            <p style="color: #9a3412; font-size: 12px; margin-top: 8px; margin-bottom: 0;">Valid for 10 minutes. Do not share this code with anyone.</p>
          </div>

          <p style="color: #71717a; font-size: 13px; line-height: 1.5;">If you did not request this verification code, you can safely ignore this message.</p>
          <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Billflow 2.0 &bull; AI-Powered SaaS Subscription & Revenue Intelligence Platform</p>
        </div>
      `,
    };

    const info = await mailer.sendMail(mailOptions);
    console.log(`[OTP Email] Successfully dispatched to ${to}: ${otp} (MessageId: ${info.messageId})`);
    return { sent: true };
  } catch (err: any) {
    console.warn(`[OTP Email Warning] Could not send via SMTP (${err.message}). Verification Code is: ${otp}`);
    return { sent: false, reason: err.message };
  }
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Billflow 2.0" <notifications@billflow.io>',
      to,
      subject: 'Welcome to Billflow 2.0 - SaaS Subscription & Billing Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-bottom: 8px;">Welcome to Billflow 2.0, ${name}!</h2>
          <p style="color: #3f3f46; font-size: 15px;">Your account has been successfully provisioned with the <strong>${role.toUpperCase()}</strong> role.</p>
          <div style="background-color: #fff7ed; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #9a3412; font-size: 14px;">Explore your real-time analytics, recurring invoices, AI intelligence forecasts, and subscription workflows from your central dashboard.</p>
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 30px;">If you have any questions, our 24/7 AI business assistant is ready to help inside your portal.</p>
        </div>
      `,
    };

    if (mailer) {
      const info = await mailer.sendMail(mailOptions);
      console.log('Welcome email dispatched:', info.messageId);
    }
  } catch (err: any) {
    console.warn('Welcome email log (simulated):', err.message);
  }
}

export async function sendInvoiceEmail(invoice: any, pdfBuffer?: Buffer) {
  try {
    const mailer = await getTransporter();
    const attachments = pdfBuffer
      ? [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [];

    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Billflow Billing" <billing@billflow.io>',
      to: invoice.customerEmail,
      subject: `Invoice ${invoice.invoiceNumber} from Billflow 2.0 (${invoice.currency} ${invoice.totalAmount})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-bottom: 8px;">New Invoice Generated</h2>
          <p style="color: #3f3f46;">Dear ${invoice.customerName},</p>
          <p style="color: #52525b;">Your recurring subscription invoice <strong>${invoice.invoiceNumber}</strong> for the period has been generated.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="border-bottom: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Amount Due:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #18181b;">${invoice.currency} ${invoice.totalAmount}</td></tr>
            <tr style="border-bottom: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a;">Due Date:</td><td style="padding: 8px 0; text-align: right; color: #18181b;">${new Date(invoice.dueDate).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a;">Status:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ea580c;">${invoice.status.toUpperCase()}</td></tr>
          </table>
          <p style="color: #52525b;">The PDF copy is attached. You can pay directly via Razorpay UPI or card in your Customer Portal.</p>
        </div>
      `,
      attachments,
    };

    if (mailer) {
      await mailer.sendMail(mailOptions);
    }
  } catch (err: any) {
    console.warn('Invoice email notice:', err.message);
  }
}

export async function sendRenewalReminderEmail(customerEmail: string, subscriptionId: string, renewalDate: Date, planName: string) {
  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Billflow Renewals" <renewals@billflow.io>',
      to: customerEmail,
      subject: `Upcoming Subscription Renewal - ${subscriptionId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
          <h2 style="color: #ea580c;">Subscription Renewal Reminder</h2>
          <p style="color: #3f3f46;">This is a friendly reminder that your subscription to <strong>${planName}</strong> (${subscriptionId}) is scheduled to renew on <strong>${new Date(renewalDate).toLocaleDateString()}</strong>.</p>
          <p style="color: #52525b;">Your saved payment method will be billed automatically. To review your plan, upgrade, or manage seats, please visit your portal.</p>
        </div>
      `,
    };

    if (mailer) {
      await mailer.sendMail(mailOptions);
    }
  } catch (err: any) {
    console.warn('Renewal email notice:', err.message);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  try {
    const mailer = await getTransporter();
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Billflow Security" <security@billflow.io>',
      to,
      subject: 'Password Reset Request - Billflow 2.0',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
          <h2 style="color: #ea580c;">Reset Your Password</h2>
          <p style="color: #3f3f46;">You requested a password reset for your Billflow account. Click the button below to set a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #71717a; font-size: 13px;">If you did not request this reset, please ignore this email or reach out to security immediately.</p>
        </div>
      `,
    };

    if (mailer) {
      await mailer.sendMail(mailOptions);
    }
  } catch (err: any) {
    console.warn('Reset email notice:', err.message);
  }
}
