import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function run() {
  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Transporter is ready!');
    
    console.log('Sending test email to client...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO, // send to admin first to test
      subject: 'SMTP Test Email',
      text: 'This is a test email.',
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('SMTP test failed:', err);
  }
}

run();
