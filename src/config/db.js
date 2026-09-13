import mongoose from 'mongoose';
import { config } from './env.js';

let cachedConnection = null;

export const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return cachedConnection;
  }

  if (!config.db.uri) {
    console.error('MongoDB URI is missing');
    return null;
  }

  try {
    const conn = await mongoose.connect(config.db.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Don't buffer forever if disconnected
    });

    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run patient-user synchronization and default seeds in the background
    seedInitialDemoAccounts().catch((err) => console.error('Background seed failed:', err));
    syncPatientsAndUsers().catch((err) => console.error('Background synchronization failed:', err));

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not call process.exit(1) on serverless environments to prevent container termination
    throw error;
  }
};

export const seedInitialDemoAccounts = async () => {
  try {
    const { User } = await import('../models/User.model.js');
    const { Patient } = await import('../models/Patient.model.js');
    const { createSubscription } = await import('../services/subscription.service.js');

    const demoUsers = [
      { name: 'Dr. Sarah Connor', email: 'doctor@cliniq.ai', password: 'Doctor@123', role: 'doctor', plan: 'pro' },
      { name: 'System Administrator', email: 'admin@cliniq.ai', password: 'Admin@123', role: 'admin', plan: 'enterprise' },
      { name: 'Front Desk Reception', email: 'receptionist@cliniq.ai', password: 'Receptionist@123', role: 'receptionist', plan: 'free' },
      { name: 'Bruce Wayne', email: 'patient@cliniq.ai', password: 'Patient@123', role: 'patient', plan: 'free' },
    ];

    for (const demo of demoUsers) {
      const exists = await User.findOne({ email: demo.email });
      if (!exists) {
        console.log(`Seeding demo user: ${demo.email}`);
        const user = await User.create({
          name: demo.name,
          email: demo.email,
          password: demo.password,
          role: demo.role,
        });

        const sub = await createSubscription(user._id, demo.plan);
        user.subscriptionPlan = sub._id;
        await user.save();

        if (demo.role === 'patient') {
          await Patient.create({
            name: demo.name,
            age: 35,
            gender: 'male',
            contact: {
              phone: '+1 555-0199',
              email: demo.email,
              address: 'Gotham City',
            },
            createdBy: user._id,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error during demo accounts seed:', err.message);
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
