import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.model.js';

dotenv.config();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users with admin@clinic.com to have the role 'admin'
    const result = await User.updateMany(
      { email: 'admin@clinic.com' },
      { $set: { role: 'admin' } }
    );

    console.log(`Successfully updated ${result.modifiedCount} user(s) to 'admin' role.`);
    
    // Also let's print all registered users to audit
    const users = await User.find({}, 'name email role');
    console.log('Current Users in Database:');
    console.log(users);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
};

run();
