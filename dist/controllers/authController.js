"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.login = exports.seedAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = __importDefault(require("../models/Admin"));
const Otp_1 = __importDefault(require("../models/Otp"));
const emailService_1 = require("../services/emailService");
// Seed default admin account if none exists
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield Admin_1.default.find();
        if (admins.length === 0) {
            console.log('[SEED] Seeding default admin account...');
            const hashedPassword = yield bcryptjs_1.default.hash('adminpassword', 10);
            const defaultAdmin = new Admin_1.default({
                email: 'admin@adaptus.com',
                password: hashedPassword,
            });
            yield defaultAdmin.save();
            console.log('[SEED] Default admin seeded: admin@adaptus.com / adminpassword (hashed)');
        }
        else {
            // Migrate any plain-text passwords in database to hashed passwords
            for (const admin of admins) {
                const isBcryptHash = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
                if (!isBcryptHash) {
                    console.log(`[MIGRATION] Hashing plain password for admin: ${admin.email}`);
                    admin.password = yield bcryptjs_1.default.hash(admin.password, 10);
                    yield admin.save();
                }
            }
            console.log('[SEED] Admin accounts check completed.');
        }
    }
    catch (error) {
        console.error('[SEED] Error seeding admin account:', error);
    }
});
exports.seedAdmin = seedAdmin;
// Start the seed check
(0, exports.seedAdmin)();
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        // Find registered admin by email
        const admin = yield Admin_1.default.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        // Check hashed password using bcrypt.compare
        const isMatch = yield bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        // Email & Password are correct -> Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store in Otp collection (upsert based on email)
        yield Otp_1.default.findOneAndUpdate({ email: email.toLowerCase() }, { otp, createdAt: new Date() }, { upsert: true, new: true });
        // Trigger SMTP email sending asynchronously
        (0, emailService_1.sendOtpEmail)(email.toLowerCase(), otp)
            .then(info => {
            if (info)
                console.log(`[AUTH] OTP email sent successfully to ${email}`);
            else
                console.warn(`[AUTH] Failed to send OTP email to ${email}`);
        })
            .catch(err => console.error('[AUTH] Error triggering OTP email:', err));
        // Return success. Securely verify OTP via email only.
        res.status(200).json({
            message: 'Password verified. OTP code has been sent to your registered email address.',
            email: email.toLowerCase()
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error during login', error });
    }
});
exports.login = login;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP code are required.' });
        }
        const otpRecord = yield Otp_1.default.findOne({ email: email.toLowerCase() });
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or never requested.' });
        }
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP code entered.' });
        }
        // OTP is valid -> clean it up
        yield Otp_1.default.deleteOne({ email: email.toLowerCase() });
        // Issue real JWT token
        const token = jsonwebtoken_1.default.sign({ email: email.toLowerCase(), role: 'admin' }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        res.status(200).json({
            success: true,
            token,
            email: email.toLowerCase(),
            message: 'OTP verified successfully. Admin session authorized.'
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error during OTP verification', error });
    }
});
exports.verifyOtp = verifyOtp;
