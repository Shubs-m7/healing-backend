import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
    personalDetails: {
        firstName: string;
        lastName: string;
        age: string; // Keeping as string to match frontend, or change to number
        gender: string;
        phone: string;
        email: string;
        address: string;
    };
    bodyParts: Array<{
        partId: string;
        painLevel: number;
        side?: 'left' | 'right' | 'both';
        selected: boolean;
    }>;
    selectedConditions: Record<string, string[]>;
    painDetails: {
        description: string;
        duration: string;
        previousTreatment: string;
        additionalNotes: string;
    };
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: Date;
}

const BookingSchema: Schema = new Schema({
    personalDetails: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        age: { type: String, required: true },
        gender: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: true },
    },
    bodyParts: [{
        partId: { type: String, required: true },
        painLevel: { type: Number, required: true },
        side: { type: String, enum: ['left', 'right', 'both'] },
        selected: { type: Boolean, default: true }
    }],
    selectedConditions: { type: Map, of: [String] },
    painDetails: {
        description: { type: String, required: true },
        duration: { type: String, required: true },
        previousTreatment: { type: String },
        additionalNotes: { type: String },
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBooking>('Booking', BookingSchema);
