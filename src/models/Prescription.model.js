import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true }, // e.g., "2x daily"
        duration: { type: String, required: true }, // e.g., "7 days"
        instructions: { type: String },
      },
    ],
    diagnosis: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    followUpDate: {
      type: Date,
    },
    pdfUrl: {
      type: String, // Cloudinary URL
    },
    isUrdu: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
