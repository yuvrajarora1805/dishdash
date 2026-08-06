import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbGet, dbRun, ensureDbReady } from '@/lib/db';
import { sendMail } from '@/lib/mail';

// Global memory cache for verification OTP codes
const otpCache = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { action, email, otp, newPassword } = body;

    const tenantId = 'dishdash-solo';

    if (action === 'send-otp') {
      if (!email) {
        return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
      }

      // Check if user account exists
      const customer = await dbGet('SELECT * FROM customers WHERE tenant_id = ? AND email = ?', [tenantId, email]);
      if (!customer) {
        return NextResponse.json({ error: 'No account registered with this email address' }, { status: 404 });
      }

      // Generate a 6-digit numeric OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifetime

      otpCache.set(email.toLowerCase(), { code, expiresAt });

      // Dispatch verification email
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #fafaf9;">
          <h2 style="color: #1c1917; font-weight: 800; font-size: 20px; margin-bottom: 12px;">Password Reset Code</h2>
          <p style="color: #57534e; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            We received a request to reset your DishDash customer account password. Use the verification code below to authorize this reset:
          </p>
          <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; padding: 14px; border-radius: 10px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #1c1917; margin-bottom: 20px;">
            ${code}
          </div>
          <p style="color: #78716c; font-size: 12px; margin-bottom: 0;">
            This code expires in 10 minutes. If you did not request this, please disregard this email.
          </p>
        </div>
      `;

      const mailResult = await sendMail({
        to: email,
        subject: 'DishDash - Password Reset Code',
        html: htmlContent
      });

      if (!mailResult.success) {
        return NextResponse.json({ error: 'Failed to dispatch verification email. Check SMTP server configs.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Verification code dispatched to your email!' });
    }

    if (action === 'reset-password') {
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ error: 'Email, verification code, and new password are required' }, { status: 400 });
      }

      const cached = otpCache.get(email.toLowerCase());
      if (!cached) {
        return NextResponse.json({ error: 'Verification code not found or expired. Request a new one.' }, { status: 400 });
      }

      if (Date.now() > cached.expiresAt) {
        otpCache.delete(email.toLowerCase());
        return NextResponse.json({ error: 'Verification code has expired. Request a new one.' }, { status: 400 });
      }

      if (cached.code !== otp.trim()) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Hash password and save to DB
      const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
      await dbRun('UPDATE customers SET password = ? WHERE tenant_id = ? AND email = ?', [hashedPassword, tenantId, email]);

      // Clear code from cache
      otpCache.delete(email.toLowerCase());

      return NextResponse.json({ success: true, message: 'Password updated successfully!' });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: 'Operation failed due to server error' }, { status: 500 });
  }
}
