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
exports.sendSchedulingLink = exports.suggestAlternativeTime = exports.scheduleBookingSlot = exports.getBookingById = exports.updateBookingStatus = exports.getBookings = exports.createBooking = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const emailService_1 = require("../services/emailService");
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Basic validation could go here if not handled by Mongoose
        const newBooking = new Booking_1.default(req.body);
        const savedBooking = yield newBooking.save();
        // Send email notifications and await them to ensure they complete on serverless environments like Vercel
        try {
            const bookingObject = savedBooking.toObject({ flattenMaps: true });
            const clientName = `${savedBooking.personalDetails.firstName} ${savedBooking.personalDetails.lastName}`;
            yield Promise.all([
                (0, emailService_1.sendBookingNotification)(bookingObject),
                (0, emailService_1.sendBookingConfirmationToClient)(savedBooking.personalDetails.email, clientName)
            ]);
            console.log('Booking notification and client confirmation emails sent successfully.');
        }
        catch (emailError) {
            console.error('Failed to send booking emails:', emailError);
        }
        res.status(201).json(savedBooking);
    }
    catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: error.message || 'Error creating booking', error });
    }
});
exports.createBooking = createBooking;
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield Booking_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(bookings);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
});
exports.getBookings = getBookings;
const updateBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const updatedBooking = yield Booking_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (status === 'confirmed') {
            if (updatedBooking.scheduledDate && updatedBooking.scheduledTime) {
                const clientName = `${updatedBooking.personalDetails.firstName} ${updatedBooking.personalDetails.lastName}`;
                try {
                    yield (0, emailService_1.sendAppointmentConfirmedEmail)(updatedBooking.personalDetails.email, clientName, updatedBooking.scheduledDate, updatedBooking.scheduledTime);
                    console.log(`[AUTH] Appointment confirmation email sent to ${updatedBooking.personalDetails.email}`);
                }
                catch (err) {
                    console.error('[AUTH] Failed to send confirmation email:', err);
                }
            }
        }
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating booking status', error });
    }
});
exports.updateBookingStatus = updateBookingStatus;
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const booking = yield Booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(booking);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching booking details', error });
    }
});
exports.getBookingById = getBookingById;
const scheduleBookingSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { scheduledDate, scheduledTime } = req.body;
        if (!scheduledDate || !scheduledTime) {
            return res.status(400).json({ message: 'Scheduled date and time are required.' });
        }
        const updatedBooking = yield Booking_1.default.findByIdAndUpdate(id, { scheduledDate, scheduledTime, $unset: { suggestedTime: "", suggestedTimes: "" } }, { new: true });
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        res.status(500).json({ message: 'Error scheduling appointment slot', error });
    }
});
exports.scheduleBookingSlot = scheduleBookingSlot;
const suggestAlternativeTime = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { suggestedTimes } = req.body;
        if (!suggestedTimes || !Array.isArray(suggestedTimes) || suggestedTimes.length === 0) {
            return res.status(400).json({ message: 'Suggested times must be a non-empty array of strings.' });
        }
        const booking = yield Booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (!booking.scheduledDate || !booking.scheduledTime) {
            return res.status(400).json({ message: 'Cannot recommend reschedule: Patient has not scheduled a slot yet.' });
        }
        // Keep scheduledDate, set suggestedTimes and clear old singular suggestedTime
        const updatedBooking = yield Booking_1.default.findByIdAndUpdate(id, { suggestedTimes, $unset: { suggestedTime: "" } }, { new: true });
        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Generate scheduler link for review
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const schedulerLink = `${frontendUrl}/schedule/${updatedBooking._id}`;
        // Send alternate slot recommendation email asynchronously
        const clientName = `${updatedBooking.personalDetails.firstName} ${updatedBooking.personalDetails.lastName}`;
        try {
            yield (0, emailService_1.sendRescheduleSuggestionEmail)(updatedBooking.personalDetails.email, clientName, updatedBooking.scheduledDate, booking.scheduledTime, // original requested time
            suggestedTimes, schedulerLink);
            console.log(`[AUTH] Reschedule suggestion email sent to client ${updatedBooking.personalDetails.email}`);
        }
        catch (err) {
            console.error('[AUTH] Failed to send reschedule suggestion email:', err);
        }
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        res.status(500).json({ message: 'Error suggesting alternative time slot', error });
    }
});
exports.suggestAlternativeTime = suggestAlternativeTime;
const sendSchedulingLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const booking = yield Booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Generate scheduler link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const schedulerLink = `${frontendUrl}/schedule/${booking._id}`;
        // Send email notification asynchronously
        const clientName = `${booking.personalDetails.firstName} ${booking.personalDetails.lastName}`;
        try {
            yield (0, emailService_1.sendSchedulingLinkEmail)(booking.personalDetails.email, clientName, schedulerLink);
            console.log(`[AUTH] Scheduling link sent to client ${booking.personalDetails.email}`);
        }
        catch (err) {
            console.error('[AUTH] Failed to send scheduling email:', err);
        }
        res.status(200).json(booking);
    }
    catch (error) {
        res.status(500).json({ message: 'Error sending scheduling link', error });
    }
});
exports.sendSchedulingLink = sendSchedulingLink;
