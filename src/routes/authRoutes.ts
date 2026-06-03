import { Router } from 'express';
import { login, verifyOtp } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtp);

export default router;
