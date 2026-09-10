import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Verify your LearnTube email',
      html: `
        <!DOCTYPE html>   
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your LearnTube Email</title>
            <style type="text/css">
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f7f6; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
                @media screen and (max-width: 600px) {
                    .email-container { width: 100% !important; margin: auto !important; }
                    .content-wrapper { padding: 20px !important; }
                    .button { width: 100% !important; display: block !important; box-sizing: border-box; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f6;">
            <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                Verify your email address to get started with LearnTube and unlock your learning journey!
            </div>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                            <tr>
                                <td align="center" style="background-color: #0b132b; padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                                        <span style="color: #4285F4;">Learn</span>Tube
                                    </h1>
                                </td>
                            </tr>
                            <tr>
                                <td class="content-wrapper" style="padding: 40px 40px 20px; color: #333333;">
                                    <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #1a1a1a;">Welcome to LearnTube!</h2>
                                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #555555;">
                                        We're excited to have you on board. You are just one step away from diving into your favorite courses. Please verify your email address to activate your account.
                                    </p>
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                        <tr>
                                            <td align="center">
                                                <table border="0" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td align="center" bgcolor="#4285F4" style="border-radius: 6px;">
                                                            <a href="${verifyUrl}" class="button" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                                                Verify Email Address
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 0 0 10px; font-size: 14px; line-height: 21px; color: #777777;">
                                        If the button doesn't work, copy and paste this link into your browser:
                                    </p>
                                    <p style="margin: 0 0 30px; font-size: 14px; line-height: 21px; word-break: break-all;">
                                        <a href="${verifyUrl}" style="color: #4285F4; text-decoration: underline;">${verifyUrl}</a>
                                    </p>
                                    <p style="margin: 0 0 10px; font-size: 14px; line-height: 21px; color: #888888;">
                                        If you didn't create an account with LearnTube, you can safely ignore and delete this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    });
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}
