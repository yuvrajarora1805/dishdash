import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'mail.omvky.com';
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER || 'noreply@dishdash555.in';
const pass = process.env.SMTP_PASS || '&,uzZoEsITrusINiSHoSPRolecEwcueRDs,83';

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass
  },
  tls: {
    rejectUnauthorized: false // Bypasses self-signed certificate validation errors if present on the server
  }
});

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  try {
    const info = await transporter.sendMail({
      from: `"DishDash" <${user}>`,
      to,
      subject,
      text: text || '',
      html
    });
    console.log('[SMTP] Email dispatched: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP] Failed to dispatch email:', error);
    return { success: false, error: error?.message || error };
  }
}

export async function sendOrderStatusUpdateEmail({
  to,
  customerName,
  orderId,
  status,
  paymentStatus,
  remarks
}: {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  remarks?: string;
}) {
  const statusColor = status === 'delivered' ? '#10b981' : status === 'cancelled' ? '#ef4444' : '#3b82f6';
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="background-color: #1c1917; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; tracking-wide">DishDash</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a8a29e;">Order Status Notification</p>
      </div>
      <div style="padding: 32px; background-color: #ffffff; color: #374151; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
        <p>Your order status has been updated. Here are the latest details regarding your purchase:</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 24px 0; font-size: 14px;">
          <div style="margin-bottom: 12px;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 15px;">#${orderId.toUpperCase()}</span></div>
          <div style="margin-bottom: 12px;">
            <strong>Order Status:</strong> 
            <span style="background-color: ${statusColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
              ${status}
            </span>
          </div>
          <div style="margin-bottom: 12px;"><strong>Payment Status:</strong> <span style="text-transform: capitalize; font-weight: 600;">${paymentStatus}</span></div>
          ${remarks ? `<div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;"><strong>Seller Remarks / Notes:</strong><br/><p style="margin: 4px 0 0 0; color: #6b7280; font-style: italic;">"${remarks}"</p></div>` : ''}
        </div>

        <p style="margin-bottom: 0;">You can view full shipment details or trace delivery paths by signing into your store <a href="http://localhost:3000/profile" style="color: #1c1917; font-weight: bold; text-decoration: underline;">Customer Profile</a>.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
        © 2026 DishDash Storefront. All rights reserved.
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: `Order Update: #${orderId.slice(0, 8).toUpperCase()} - ${status.toUpperCase()}`,
    html
  });
}
