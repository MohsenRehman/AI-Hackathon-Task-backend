import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    bloodGroup: {
      type: String,
    },
    contact: {
      phone: String,
      email: String,
      address: String,
    },
    medicalHistory: [
      {
        type: String, // Array of past conditions
      },
    ],
    allergies: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Doctor or receptionist who registered
    },
    profileImage: {
      type: String, // Cloudinary URL
    },
  },
  {
    timestamps: true,
  }
);

export const Patient = mongoose.model('Patient', patientSchema);
