import dotenv from 'dotenv';
dotenv.config();

import { sendBookingNotification, sendBookingConfirmationToClient } from './src/services/emailService';

async function run() {
  const dummyBooking = {
    _id: '6a201b0f6651ca50d200ce9a',
    createdAt: new Date(),
    personalDetails: {
      firstName: 'Shubham',
      lastName: 'Mulye',
      email: 'shubs.mulye@gmail.com',
      phone: '+919999999999',
      age: '25',
      gender: 'male',
      address: 'Test Address'
    },
    bodyParts: [
      { partId: 'shoulder', painLevel: 7, side: 'left', selected: true }
    ],
    selectedConditions: {
      shoulder: ['Frozen Shoulder']
    },
    painDetails: {
      description: 'Pain in shoulder',
      duration: '3 months',
      previousTreatment: 'None',
      additionalNotes: 'None'
    },
    status: 'pending'
  };

  console.log('Sending admin booking notification...');
  const resAdmin = await sendBookingNotification(dummyBooking);
  console.log('Admin email response:', resAdmin ? 'SUCCESS' : 'FAILED');

  console.log('Sending client booking confirmation...');
  const resClient = await sendBookingConfirmationToClient('shubs.mulye@gmail.com', 'Shubham Mulye');
  console.log('Client email response:', resClient ? 'SUCCESS' : 'FAILED');
}

run();
