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
exports.sendRescheduleSuggestionEmail = exports.sendBookingConfirmationToClient = exports.sendAppointmentConfirmedEmail = exports.sendSchedulingLinkEmail = exports.sendOtpEmail = exports.sendBookingNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('Email Service Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
});
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendBookingNotification = (bookingDetails) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const adminLink = `${frontendUrl}/admin`;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_TO,
            subject: 'New Appointment Booking - PhysioHeal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">New Appointment Booking</h2>
                    
                    <h3>Personal Details</h3>
                    <p><strong>Name:</strong> ${bookingDetails.personalDetails.firstName} ${bookingDetails.personalDetails.lastName}</p>
                    <p><strong>Phone:</strong> ${bookingDetails.personalDetails.phone}</p>
                    <p><strong>Email:</strong> ${bookingDetails.personalDetails.email}</p>
                    <p><strong>Age/Gender:</strong> ${bookingDetails.personalDetails.age} / ${bookingDetails.personalDetails.gender}</p>
                    <p><strong>Address:</strong> ${bookingDetails.personalDetails.address}</p>

                    <h3>Pain Details</h3>
                    <p><strong>Description:</strong> ${bookingDetails.painDetails.description}</p>
                    <p><strong>Duration:</strong> ${bookingDetails.painDetails.duration}</p>
                    <p><strong>Previous Treatment:</strong> ${bookingDetails.painDetails.previousTreatment || 'None/Not provided'}</p>
                    <p><strong>Additional Notes:</strong> ${bookingDetails.painDetails.additionalNotes || 'None'}</p>
                    
                    <h3>Selected Areas & Conditions</h3>
                    <ul>
                        ${bookingDetails.bodyParts.map((part) => `
                            <li>
                                <strong>${part.partId.toUpperCase()}</strong> 
                                (Pain Level: ${part.painLevel}/10${part.side ? `, Side: ${part.side}` : ''})
                                ${bookingDetails.selectedConditions && bookingDetails.selectedConditions[part.partId] && bookingDetails.selectedConditions[part.partId].length > 0
                ? `<br><em>Conditions: ${bookingDetails.selectedConditions[part.partId].join(', ')}</em>`
                : ''}
                            </li>
                        `).join('')}
                    </ul>

                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${adminLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Open Admin Appointments Panel
                        </a>
                    </div>

                    <p style="margin-top: 20px; font-size: 12px; color: #888; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                        Booking ID: ${bookingDetails._id}<br>
                        Created At: ${new Date(bookingDetails.createdAt).toLocaleString()}
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        // We don't throw here to avoid failing the booking request if email fails
        return null;
    }
});
exports.sendBookingNotification = sendBookingNotification;
const sendOtpEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Admin Login Verification Code - Adaptus Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: bold; tracking-tight: -0.025em;">ADAPTUS CLINIC</h2>
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Admin Portal Authentication</span>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Dear Admin,</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">You have initiated a login request. Use the verification code below to complete your authentication:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-family: monospace; font-size: 36px; font-weight: 800; color: #1e1b4b; letter-spacing: 6px; padding: 12px 24px; background-color: #f3f4f6; border-radius: 8px; border: 1px solid #e5e7eb; display: inline-block;">
                            ${otp}
                        </span>
                    </div>

                    <p style="color: #ef4444; font-size: 13px; margin-top: 20px;"><strong>Note:</strong> This verification code is valid for 5 minutes and can only be used once.</p>
                    
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; line-height: 1.5;">
                        If you did not initiate this request, please contact IT support and change your password immediately.
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('OTP Email sent: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending OTP email:', error);
        return null;
    }
});
exports.sendOtpEmail = sendOtpEmail;
const sendSchedulingLinkEmail = (email, name, link) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Confirm Your Session Schedule - Adaptus Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: bold; tracking-tight: -0.025em;">ADAPTUS CLINIC</h2>
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Physiotherapy Care</span>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Dear ${name},</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">We are pleased to inform you that your physiotherapy appointment request has been **confirmed** by our clinical team!</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Please click the button below to pick your preferred date and time slot for your physical session:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            Select Date & Time Slot
                        </a>
                    </div>

                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; line-height: 1.5;">
                        Alternatively, copy and paste this link in your browser: <br>
                        <a href="${link}" style="color: #4f46e5; word-break: break-all;">${link}</a>
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Scheduling Link email sent: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending scheduling link email:', error);
        return null;
    }
});
exports.sendSchedulingLinkEmail = sendSchedulingLinkEmail;
const sendAppointmentConfirmedEmail = (email, name, date, time) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Appointment Confirmed - Adaptus Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: bold;">APPOINTMENT SCHEDULED</h2>
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Adaptus Clinic</span>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Dear ${name},</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Your appointment slot has been successfully scheduled and locked in!</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                        <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">Scheduled Date</p>
                        <p style="margin: 5px 0 15px 0; font-size: 18px; color: #14532d; font-weight: bold;">${date}</p>
                        <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">Time Slot</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px; color: #14532d; font-weight: bold;">${time}</p>
                    </div>

                    <p style="font-size: 14px; color: #374151;"><strong>Location</strong>: PhysioHeal Clinic, 123 Wellness Street</p>
                    <p style="font-size: 14px; color: #374151;">Please arrive 10 minutes prior to your scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.</p>

                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; line-height: 1.5;">
                        Thank you for choosing Adaptus Clinic. We look forward to helping you recover!
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Appointment Confirmed email sent: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending appointment confirmed email:', error);
        return null;
    }
});
exports.sendAppointmentConfirmedEmail = sendAppointmentConfirmedEmail;
const sendBookingConfirmationToClient = (email, name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'We Received Your Booking Request - Adaptus Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: bold; tracking-tight: -0.025em;">ADAPTUS CLINIC</h2>
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Physiotherapy Care</span>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Dear ${name},</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Thank you for requesting an appointment with Adaptus Clinic!</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">We have successfully received your booking request. Our clinical team is currently reviewing your pain/symptom details to prepare your personalized care options.</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Once reviewed and confirmed, we will send you another email containing a link to select your preferred date and time slot for your physical session.</p>
                    
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; line-height: 1.5;">
                        If you have any immediate questions, please contact our clinic support desk. Thank you for choosing Adaptus Clinic!
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Booking Acknowledgement Email sent to client: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending booking acknowledgement email:', error);
        return null;
    }
});
exports.sendBookingConfirmationToClient = sendBookingConfirmationToClient;
const sendRescheduleSuggestionEmail = (email, name, date, selectedTime, suggestedTimes, link) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Alternate Session Times Recommended - Adaptus Clinic',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: bold; tracking-tight: -0.025em;">RESCHEDULE REQUEST</h2>
                        <span style="font-size: 12px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Adaptus Clinic</span>
                    </div>
                    
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Dear ${name},</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Thank you for selecting a slot for your physical session. We received your request for <strong>${date}</strong> at <strong>${selectedTime}</strong>.</p>
                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Unfortunately, that exact slot is no longer available due to scheduling conflicts. However, our clinical team recommends shifting your session to one of the following alternate time slots on that same day (**${date}**):</p>
                    
                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #b45309; font-weight: 600; text-align: center;">Recommended Alternative Slots</p>
                        <ul style="margin: 0; padding-left: 20px; color: #78350f; font-weight: bold; font-size: 16px;">
                            ${suggestedTimes.map(t => `<li style="margin-bottom: 5px;">${t}</li>`).join('')}
                        </ul>
                    </div>

                    <p style="font-size: 15px; color: #374151; line-height: 1.5;">Please click the button below to review this recommendation, where you can instantly accept one of the suggested times or choose a completely different slot:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);">
                            Review & Reschedule Session
                        </a>
                    </div>

                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; line-height: 1.5;">
                        Alternatively, copy and paste this link in your browser: <br>
                        <a href="${link}" style="color: #f59e0b; word-break: break-all;">${link}</a>
                    </p>
                </div>
            `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Reschedule suggestion email sent to client: ' + info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending reschedule suggestion email:', error);
        return null;
    }
});
exports.sendRescheduleSuggestionEmail = sendRescheduleSuggestionEmail;
