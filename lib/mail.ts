import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'mail.omvky.com';
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER || 'noreply@dishdash555.in';
const pass = process.env.SMTP_PASS || '&,uzZoEsITrusINiSHoSPRolecEwcueRDs,83';

// Replace this base64 string with your actual DishDash logo Base64.
// For now, it's a tiny transparent pixel placeholder so it doesn't break.
const DISHDASH_LOGO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nCJ8xAAAAAElFTkSuQmCC';

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Common responsive CSS head injected into all templates
const getEmailHead = (title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; -webkit-font-smoothing: antialiased; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background-color: #1c1917; padding: 32px 24px; text-align: center; color: #ffffff; }
    .header-logo { max-width: 140px; height: auto; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto; }
    .header h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .content { padding: 32px; color: #374151; line-height: 1.6; }
    .summary-box { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 24px; border-radius: 12px; margin: 24px 0; font-size: 14px; }
    .footer { background-color: #f9fafb; padding: 20px 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    
    .data-row { margin-bottom: 12px; }
    .data-label { font-weight: 600; color: #4b5563; }
    .data-value { font-family: monospace; font-size: 15px; color: #111827; }
    
    .item-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .item-table td, .item-table th { padding: 12px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .item-table th { color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .item-table .text-right { text-align: right; }
    .item-table tfoot td { font-size: 16px; font-weight: 800; color: #111827; padding-top: 16px; border-bottom: none; }
    
    /* Responsive Adjustments for Mobile */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; border: none !important; box-shadow: none !important; margin: 0 !important; }
      .header { padding: 24px 16px !important; }
      .header-logo { max-width: 110px !important; }
      .content { padding: 20px 16px !important; }
      .summary-box { padding: 16px !important; margin: 16px 0 !important; }
      .item-table td, .item-table th { padding: 10px 4px !important; font-size: 13px !important; }
      .item-table tfoot td { font-size: 15px !important; }
    }
  </style>
</head>
<body>
`;

const getEmailFooter = () => `
  </body>
</html>
`;

export async function sendMail({ to, subject, html, text, attachments }: { to: string; subject: string; html: string; text?: string; attachments?: any[] }) {
  try {
    const info = await transporter.sendMail({
      from: `"DishDash" <${user}>`,
      to,
      subject,
      text: text || '',
      html,
      attachments
    });
    console.log('[SMTP] Email dispatched: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP] Failed to dispatch email:', error);
    return { success: false, error: error?.message || error };
  }
}

// Common attachment array for injecting the logo
const getLogoAttachment = () => ([{
  filename: 'dishdash-logo.png',
  content: DISHDASH_LOGO_BASE64,
  encoding: 'base64',
  cid: 'dishdash-logo'
}]);

export async function sendOrderStatusUpdateEmail({
  to, customerName, orderId, status, paymentStatus, remarks
}: {
  to: string; customerName: string; orderId: string; status: string; paymentStatus: string; remarks?: string;
}) {
  const statusColor = status === 'delivered' ? '#10b981' : status === 'cancelled' ? '#ef4444' : '#3b82f6';
  
  const html = `
    ${getEmailHead('Order Status Update')}
    <div class="email-container">
      <div class="header">
        <img src="cid:dishdash-logo" alt="DishDash Logo" class="header-logo" />
        <h2>DishDash</h2>
        <p>Order Status Notification</p>
      </div>
      <div class="content">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
        <p>Your order status has been updated. Here are the latest details regarding your purchase:</p>
        
        <div class="summary-box">
          <div class="data-row">
            <span class="data-label">Order ID:</span> 
            <span class="data-value">#${orderId.toUpperCase()}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Order Status:</span> 
            <span style="background-color: ${statusColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-left: 4px;">
              ${status}
            </span>
          </div>
          <div class="data-row">
            <span class="data-label">Payment Status:</span> 
            <span style="text-transform: capitalize; font-weight: 600; margin-left: 4px; color: #111827;">${paymentStatus}</span>
          </div>
          ${remarks ? `<div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;"><span class="data-label">Seller Remarks:</span><p style="margin: 6px 0 0 0; color: #6b7280; font-style: italic;">"${remarks}"</p></div>` : ''}
        </div>

        <p style="margin-bottom: 0;">You can view full shipment details or trace delivery paths by signing into your <a href="http://localhost:3000/profile" style="color: #1c1917; font-weight: bold; text-decoration: underline;">Customer Profile</a>.</p>
      </div>
      <div class="footer">
        © 2026 DishDash Storefront. All rights reserved.
      </div>
    </div>
    ${getEmailFooter()}
  `;

  return sendMail({
    to,
    subject: `Order Update: #${orderId.slice(0, 8).toUpperCase()} - ${status.toUpperCase()}`,
    html,
    attachments: getLogoAttachment()
  });
}

export async function sendOrderConfirmationEmail({
  to, customerName, orderId, totalAmount, paymentMethod, items
}: {
  to: string; customerName: string; orderId: string; totalAmount: number; paymentMethod: string;
  items: { product_name: string; quantity: number; price: number }[];
}) {
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.product_name} <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">x ${item.quantity}</span></td>
      <td class="text-right">₹${item.price}</td>
    </tr>
  `).join('');

  const html = `
    ${getEmailHead('Order Confirmation')}
    <div class="email-container">
      <div class="header">
        <img src="cid:dishdash-logo" alt="DishDash Logo" class="header-logo" />
        <h2>DishDash</h2>
        <p>Order Confirmation Receipt</p>
      </div>
      <div class="content">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
        <p>Thank you for shopping with DishDash! We have successfully received your order.</p>
        
        <div class="summary-box">
          <div class="data-row">
            <span class="data-label">Order ID:</span> 
            <span class="data-value">#${orderId.toUpperCase()}</span>
          </div>
          <div class="data-row" style="margin-bottom: 20px;">
            <span class="data-label">Payment Method:</span> 
            <span style="text-transform: capitalize; font-weight: 600; margin-left: 4px; color: #111827;">${paymentMethod}</span>
          </div>
          
          <h3 style="margin: 0 0 12px 0; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Summary</h3>
          <table class="item-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Paid:</td>
                <td class="text-right" style="color: #10b981;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style="margin-bottom: 0;">We will notify you again once your order has been dispatched.</p>
      </div>
      <div class="footer">
        © 2026 DishDash Storefront. All rights reserved.
      </div>
    </div>
    ${getEmailFooter()}
  `;

  return sendMail({
    to,
    subject: `Order Confirmation: #${orderId.slice(0, 8).toUpperCase()}`,
    html,
    attachments: getLogoAttachment()
  });
}

export async function sendKhataSettlementEmail({
  to, customerName, amount, description, date,
}: {
  to: string; customerName: string; amount: number; description: string; date: string;
}) {
  const html = `
    ${getEmailHead('Khata Payment Receipt')}
    <div class="email-container">
      <div class="header" style="background-color: #10b981;">
        <img src="cid:dishdash-logo" alt="DishDash Logo" class="header-logo" />
        <h2>DishDash</h2>
        <p style="color: #ecfdf5;">Khata Payment Receipt</p>
      </div>
      <div class="content">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${customerName}</strong>,</p>
        <p>We have successfully received a payment towards your Khata (store credit) balance.</p>
        
        <div class="summary-box" style="text-align: center; border-color: #a7f3d0; background-color: #f0fdf4;">
          <p style="margin: 0; color: #047857; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Payment Amount</p>
          <p style="margin: 12px 0; font-size: 36px; font-weight: 900; color: #10b981; letter-spacing: -1px;">₹${amount}</p>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #d1fae5; text-align: left;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #047857; font-weight: 600;">Description:</span>
              <span style="font-weight: bold; color: #065f46;">${description}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #047857; font-weight: 600;">Date:</span>
              <span style="font-weight: bold; color: #065f46;">${date}</span>
            </div>
          </div>
        </div>

        <p style="margin-bottom: 0;">Thank you for your prompt payment!</p>
      </div>
      <div class="footer">
        © 2026 DishDash Storefront. All rights reserved.
      </div>
    </div>
    ${getEmailFooter()}
  `;

  return sendMail({
    to,
    subject: `Payment Received: ₹${amount} (Khata Settlement)`,
    html,
    attachments: getLogoAttachment()
  });
}
