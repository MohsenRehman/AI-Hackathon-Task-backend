import { DiagnosisLog } from '../models/DiagnosisLog.model.js';
import { Prescription } from '../models/Prescription.model.js';
import { analyzeSymptoms, explainPrescription } from '../services/ai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const checkSymptoms = asyncHandler(async (req, res, next) => {
  const { patientId, symptoms, patientAge, patientGender, medicalHistory } = req.body;

  const aiResult = await analyzeSymptoms({
    symptoms,
    age: patientAge,
    gender: patientGender,
    medicalHistory,
  });

  const diagnosisLog = await DiagnosisLog.create({
    patientId,
    doctorId: req.user._id,
    symptoms,
    patientAge,
    patientGender,
    aiResponse: aiResult,
    isFallback: aiResult.isFallback,
    rawPrompt: `Symptoms: ${symptoms}, Age: ${patientAge}, Gender: ${patientGender}`, // simple log
  });

  successResponse(res, 200, 'AI symptom analysis complete', diagnosisLog);
});

export const getPrescriptionExplanation = asyncHandler(async (req, res, next) => {
  const { prescriptionId } = req.params;
  const { language } = req.query; // e.g., ?language=ur

  const prescription = await Prescription.findById(prescriptionId).lean();
  if (!prescription) return next(new AppError('Prescription not found', 404));

  const explanation = await explainPrescription(prescription, language === 'ur');

  successResponse(res, 200, 'AI prescription explanation complete', explanation);
});
