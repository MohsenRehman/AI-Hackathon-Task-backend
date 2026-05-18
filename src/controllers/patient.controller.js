import { Patient } from '../models/Patient.model.js';
import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationData, getPaginationMeta } from '../utils/pagination.js';
import { createSubscription } from '../services/subscription.service.js';

export const createPatient = asyncHandler(async (req, res, next) => {
  const { name, age, gender, phone, email, address } = req.body;

  const newPatient = await Patient.create({
    name,
    age: Number(age),
    gender,
    contact: {
      phone: phone || req.body.contact?.phone || '',
      email: email || req.body.contact?.email || '',
      address: address || req.body.contact?.address || '',
    },
    createdBy: req.user._id,
  });

  // Also create a corresponding User account so they can log in and show up in Admin lists
  const generatedEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}@cliniq.ai`;
  const existingUser = await User.findOne({ email: generatedEmail });
  if (!existingUser) {
    const defaultPassword = 'Patient@123';
    const user = await User.create({
      name,
      email: generatedEmail,
      password: defaultPassword,
      role: 'patient',
    });
    const subscription = await createSubscription(user._id, 'free');
    user.subscriptionPlan = subscription._id;
    await user.save();
  }

  successResponse(res, 201, 'Patient registered successfully', newPatient);
});

export const getPatients = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationData(req.query);

  // If user is doctor/receptionist, they might only see patients they created or all clinic patients depending on rules
  // For now, let's say all authenticated staff can see all patients
  let query = {};
  if (req.user.role === 'doctor') {
    // Optionally restrict to doctor's patients if required
  }

  const patients = await Patient.find(query).skip(skip).limit(limit).lean();
  const total = await Patient.countDocuments(query);

  successResponse(res, 200, 'Patients fetched successfully', patients, getPaginationMeta(total, page, limit));
});

export const getPatientById = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id).lean();
  if (!patient) return next(new AppError('Patient not found', 404));

  successResponse(res, 200, 'Patient fetched successfully', patient);
});
