import { Router } from 'express';

// Let's just import controller content
import { createBooking, getBookings } from '../controllers/bookingController';

const router = Router();

router.post('/', createBooking);
router.get('/', getBookings);

export default router;
