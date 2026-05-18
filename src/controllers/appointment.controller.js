import { Appointment } from '../models/Appointment.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationData, getPaginationMeta } from '../utils/pagination.js';

export const createAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.create(req.body);
  successResponse(res, 201, 'Appointment created successfully', appointment);
});

export const getAppointments = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationData(req.query);

  let query = {};
  if (req.user.role === 'doctor') {
    query.doctorId = req.user._id;
  } else if (req.user.role === 'patient') {
    // Note: patient needs a way to map to Patient record. Assume frontend sends patient ID or it's linked
    // For this generic implementation, we'll return all if admin/receptionist
  }

  const appointments = await Appointment.find(query)
    .populate('patientId', 'name contact')
    .populate('doctorId', 'name')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Appointment.countDocuments(query);

  successResponse(res, 200, 'Appointments fetched', appointments, getPaginationMeta(total, page, limit));
});

export const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  successResponse(res, 200, 'Appointment status updated', appointment);
});
