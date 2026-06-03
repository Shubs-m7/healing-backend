import { Router } from 'express';

// Let's just import controller content
import { 
  createBooking, 
  getBookings, 
  updateBookingStatus, 
  getBookingById, 
  scheduleBookingSlot,
  sendSchedulingLink,
  suggestAlternativeTime
} from '../controllers/bookingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/', createBooking);
router.get('/', authenticateToken, getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', authenticateToken, updateBookingStatus);
router.post('/:id/send-link', authenticateToken, sendSchedulingLink);
router.patch('/:id/suggest-time', authenticateToken, suggestAlternativeTime);
router.patch('/:id/schedule', scheduleBookingSlot);

export default router;
