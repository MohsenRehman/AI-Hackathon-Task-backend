import mongoose from 'mongoose';
import { config } from './env.js';

let cachedConnection = null;

export const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }

  if (!config.db.uri) {
    console.error('MongoDB URI is missing');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return null;
  }

  try {
    const conn = await mongoose.connect(config.db.uri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run patient-user synchronization in the background
    syncPatientsAndUsers().catch((err) => console.error('Background synchronization failed:', err));

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export const syncPatientsAndUsers = async () => {
  try {
    const { User } = await import('../models/User.model.js');
    const { Patient } = await import('../models/Patient.model.js');
    const { createSubscription } = await import('../services/subscription.service.js');

    console.log('Running self-healing Patient-User synchronization...');

    // 1. Sync User (role: patient) -> Patient collection
    const patientUsers = await User.find({ role: 'patient' });
    for (const u of patientUsers) {
      const patient = await Patient.findOne({
        $or: [
          { name: u.name },
          { 'contact.email': u.email },
        ],
      });

      if (!patient) {
        console.log(`Syncing Patient User "${u.name}" to Patient collection...`);
        const adminUser = await User.findOne({ role: 'admin' });
        const creatorId = adminUser ? adminUser._id : u._id;

        await Patient.create({
          name: u.name,
          age: 30,
          gender: 'male',
          contact: {
            phone: '',
            email: u.email,
            address: '',
          },
          createdBy: creatorId,
        });
      }
    }

    // 2. Sync Patient collection -> User (role: patient) collection
    const patients = await Patient.find();
    for (const p of patients) {
      const email = p.contact?.email || `${p.name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}@cliniq.ai`;
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`Syncing Patient record "${p.name}" to User collection...`);
        const newUser = await User.create({
          name: p.name,
          email,
          password: 'Patient@123',
          role: 'patient',
        });

        const subscription = await createSubscription(newUser._id, 'free');
        newUser.subscriptionPlan = subscription._id;
        await newUser.save();
      }
    }

    console.log('User and Patient collections are fully synchronized successfully!');
  } catch (error) {
    console.error('Error in syncPatientsAndUsers:', error);
  }
};
