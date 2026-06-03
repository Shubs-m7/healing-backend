import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import Otp from '../models/Otp';
import { sendOtpEmail } from '../services/emailService';

// Seed default admin account if none exists
export const seedAdmin = async () => {
  try {
    const admins = await Admin.find();
    if (admins.length === 0) {
      console.log('[SEED] Seeding default admin account...');
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const defaultAdmin = new Admin({
        email: 'admin@adaptus.com',
        password: hashedPassword,
      });
      await defaultAdmin.save();
      console.log('[SEED] Default admin seeded: admin@adaptus.com / adminpassword (hashed)');
    } else {
      // Migrate any plain-text passwords in database to hashed passwords
      for (const admin of admins) {
        const isBcryptHash = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
        if (!isBcryptHash) {
          console.log(`[MIGRATION] Hashing plain password for admin: ${admin.email}`);
          admin.password = await bcrypt.hash(admin.password, 10);
          await admin.save();
        }
      }
      console.log('[SEED] Admin accounts check completed.');
    }
  } catch (error) {
    console.error('[SEED] Error seeding admin account:', error);
  }
};

// Start the seed check
seedAdmin();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find registered admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check hashed password using bcrypt.compare
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Email & Password are correct -> Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Otp collection (upsert based on email)
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Trigger SMTP email sending and await it for serverless compatibility
    try {
      const info = await sendOtpEmail(email.toLowerCase(), otp);
      if (info) console.log(`[AUTH] OTP email sent successfully to ${email}`);
      else console.warn(`[AUTH] Failed to send OTP email to ${email}`);
    } catch (err) {
      console.error('[AUTH] Error triggering OTP email:', err);
    }

    // Return success. Securely verify OTP via email only.
    res.status(200).json({
      message: 'Password verified. OTP code has been sent to your registered email address.',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error during login', error });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or never requested.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code entered.' });
    }

    // OTP is valid -> clean it up
    await Otp.deleteOne({ email: email.toLowerCase() });

    // Issue real JWT token
    const token = jwt.sign(
      { email: email.toLowerCase(), role: 'admin' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      email: email.toLowerCase(),
      message: 'OTP verified successfully. Admin session authorized.'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error during OTP verification', error });
  }
};
