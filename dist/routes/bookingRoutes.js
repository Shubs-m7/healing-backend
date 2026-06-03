"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Let's just import controller content
const bookingController_1 = require("../controllers/bookingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', bookingController_1.createBooking);
router.get('/', authMiddleware_1.authenticateToken, bookingController_1.getBookings);
router.get('/:id', bookingController_1.getBookingById);
router.patch('/:id/status', authMiddleware_1.authenticateToken, bookingController_1.updateBookingStatus);
router.post('/:id/send-link', authMiddleware_1.authenticateToken, bookingController_1.sendSchedulingLink);
router.patch('/:id/suggest-time', authMiddleware_1.authenticateToken, bookingController_1.suggestAlternativeTime);
router.patch('/:id/schedule', bookingController_1.scheduleBookingSlot);
exports.default = router;
