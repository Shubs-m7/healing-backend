import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './src/models/Booking';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healing-touch';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(3);
    console.log('Latest Bookings:');
    bookings.forEach((b, idx) => {
      console.log(`\n[${idx + 1}] ID: ${b._id}`);
      console.log(`Name: ${b.personalDetails.firstName} ${b.personalDetails.lastName}`);
      console.log(`Email: ${b.personalDetails.email}`);
      console.log(`Status: ${b.status}`);
      console.log(`Created At: ${b.createdAt}`);
      console.log(`Scheduled Date: ${b.scheduledDate || 'None'}, Time: ${b.scheduledTime || 'None'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
