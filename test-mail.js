const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing SMTP Connection...');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.omvky.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to send test email...');
    const info = await transporter.sendMail({
      from: `"DishDash Test" <${process.env.SMTP_USER}>`,
      to: 'yuvrajarora1805@gmail.com', // sending to user's email
      subject: "SMTP Test Email",
      text: "If you are reading this, your SMTP configuration is working perfectly!",
      html: "<b>If you are reading this, your SMTP configuration is working perfectly!</b>"
    });
    
    console.log('✅ SUCCESS! Email sent successfully.');
    console.log('Message ID: %s', info.messageId);
  } catch (error) {
    console.error('❌ ERROR! Failed to send email.');
    console.error(error);
  }
}

testEmail();
