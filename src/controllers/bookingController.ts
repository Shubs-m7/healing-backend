import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { 
  sendBookingNotification, 
  sendSchedulingLinkEmail, 
  sendAppointmentConfirmedEmail,
  sendBookingConfirmationToClient,
  sendRescheduleSuggestionEmail
} from '../services/emailService';

export const createBooking = async (req: Request, res: Response) => {
    try {
        // Basic validation could go here if not handled by Mongoose
        const newBooking = new Booking(req.body);
        const savedBooking = await newBooking.save();

        // Send email notifications and await them to ensure they complete on serverless environments like Vercel
        try {
            const bookingObject = savedBooking.toObject({ flattenMaps: true });
            const clientName = `${savedBooking.personalDetails.firstName} ${savedBooking.personalDetails.lastName}`;
            await Promise.all([
                sendBookingNotification(bookingObject),
                sendBookingConfirmationToClient(savedBooking.personalDetails.email, clientName)
            ]);
            console.log('Booking notification and client confirmation emails sent successfully.');
        } catch (emailError) {
            console.error('Failed to send booking emails:', emailError);
        }

        res.status(201).json(savedBooking);
    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: error.message || 'Error creating booking', error });
    }
};

export const getBookings = async (req: Request, res: Response) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (status === 'confirmed') {
            if (updatedBooking.scheduledDate && updatedBooking.scheduledTime) {
                const clientName = `${updatedBooking.personalDetails.firstName} ${updatedBooking.personalDetails.lastName}`;
                try {
                    await sendAppointmentConfirmedEmail(
                        updatedBooking.personalDetails.email, 
                        clientName, 
                        updatedBooking.scheduledDate, 
                        updatedBooking.scheduledTime
                    );
                    console.log(`[AUTH] Appointment confirmation email sent to ${updatedBooking.personalDetails.email}`);
                } catch (err) {
                    console.error('[AUTH] Failed to send confirmation email:', err);
                }
            }
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking status', error });
    }
};

export const getBookingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking details', error });
    }
};

export const scheduleBookingSlot = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { scheduledDate, scheduledTime } = req.body;

        if (!scheduledDate || !scheduledTime) {
            return res.status(400).json({ message: 'Scheduled date and time are required.' });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { scheduledDate, scheduledTime, $unset: { suggestedTime: "", suggestedTimes: "" } },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: 'Error scheduling appointment slot', error });
    }
};

export const suggestAlternativeTime = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { suggestedTimes } = req.body;

        if (!suggestedTimes || !Array.isArray(suggestedTimes) || suggestedTimes.length === 0) {
            return res.status(400).json({ message: 'Suggested times must be a non-empty array of strings.' });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!booking.scheduledDate || !booking.scheduledTime) {
            return res.status(400).json({ message: 'Cannot recommend reschedule: Patient has not scheduled a slot yet.' });
        }

        // Keep scheduledDate, set suggestedTimes and clear old singular suggestedTime
        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { suggestedTimes, $unset: { suggestedTime: "" } },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Generate scheduler link for review
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const schedulerLink = `${frontendUrl}/schedule/${updatedBooking._id}`;

        // Send alternate slot recommendation email asynchronously
        const clientName = `${updatedBooking.personalDetails.firstName} ${updatedBooking.personalDetails.lastName}`;
        try {
            await sendRescheduleSuggestionEmail(
                updatedBooking.personalDetails.email,
                clientName,
                updatedBooking.scheduledDate as string,
                booking.scheduledTime as string, // original requested time
                suggestedTimes,
                schedulerLink
            );
            console.log(`[AUTH] Reschedule suggestion email sent to client ${updatedBooking.personalDetails.email}`);
        } catch (err) {
            console.error('[AUTH] Failed to send reschedule suggestion email:', err);
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: 'Error suggesting alternative time slot', error });
    }
};

export const sendSchedulingLink = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Generate scheduler link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const schedulerLink = `${frontendUrl}/schedule/${booking._id}`;
        
        // Send email notification asynchronously
        const clientName = `${booking.personalDetails.firstName} ${booking.personalDetails.lastName}`;
        try {
            await sendSchedulingLinkEmail(booking.personalDetails.email, clientName, schedulerLink);
            console.log(`[AUTH] Scheduling link sent to client ${booking.personalDetails.email}`);
        } catch (err) {
            console.error('[AUTH] Failed to send scheduling email:', err);
        }

        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error sending scheduling link', error });
    }
};

