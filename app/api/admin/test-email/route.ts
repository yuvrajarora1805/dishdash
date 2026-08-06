import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Recipient email parameter is required' }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 20px auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 16px; background-color: #fafaf9;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <span style="font-weight: 800; font-size: 20px; color: #1c1917;">DishDash</span>
          <span style="color: #78716c; font-size: 14px;">Verification Portal</span>
        </div>
        <h2 style="color: #1c1917; font-size: 20px; font-weight: 800; margin-bottom: 12px;">SMTP Settings Active</h2>
        <p style="color: #57534e; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          This message confirms that your mail credentials for <strong>noreply@dishdash555.in</strong> have been successfully verified on the server <strong>mail.omvky.com</strong>.
        </p>
        <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; padding: 16px; border-radius: 12px; text-align: center; font-family: monospace; font-size: 18px; font-weight: 700; color: #1c1917; margin-bottom: 24px;">
          STATUS: VERIFIED
        </div>
        <p style="color: #a8a29e; font-size: 11px; line-height: 1.4; border-t: 1px solid #e7e5e4; padding-top: 16px;">
          Security Notice: This is an automated notification. If you did not trigger this connection test, please audit your application secrets file immediately.
        </p>
      </div>
    `;

    const response = await sendMail({
      to: email,
      subject: 'DishDash - SMTP Account Verification test',
      html: htmlContent
    });

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || error }, { status: 500 });
  }
}
