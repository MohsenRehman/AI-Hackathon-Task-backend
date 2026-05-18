import mongoose from 'mongoose';

const aiResponseSchema = new mongoose.Schema(
  {
    possibleConditions: [String],
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
    },
    suggestedTests: [String],
    recommendations: [String],
    disclaimer: String,
  },
  { _id: false }
);

const diagnosisLogSchema = new mongoose.Schema(
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
    symptoms: [
      {
        type: String,
        required: true,
      },
    ],
    patientAge: {
      type: Number,
    },
    patientGender: {
      type: String,
    },
    aiResponse: aiResponseSchema,
    isFallback: {
      type: Boolean,
      default: false,
    },
    rawPrompt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const DiagnosisLog = mongoose.model('DiagnosisLog', diagnosisLogSchema);
