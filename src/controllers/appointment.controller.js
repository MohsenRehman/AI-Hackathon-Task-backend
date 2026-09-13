import { Appointment } from '../models/Appointment.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationData, getPaginationMeta } from '../utils/pagination.js';

export const createAppointment = asyncHandler(async (req, res, next) => {
  let { patientId, doctorId, scheduledAt, type, duration } = req.body;

  if (req.user.role === 'patient') {
    if (!patientId) {
      const { Patient } = await import('../models/Patient.model.js');
      const patientDoc = await Patient.findOne({
        $or: [
          { createdBy: req.user._id },
          { 'contact.email': req.user.email },
          { name: req.user.name },
        ],
      });
      patientId = patientDoc ? patientDoc._id : req.user._id;
    }
  }

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    scheduledAt,
    type: type || 'in-person',
    duration: duration || 30,
    status: 'scheduled',
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('patientId', 'name contact')
    .populate('doctorId', 'name');

  successResponse(res, 201, 'Appointment created successfully', populated);
});

export const getAppointments = asyncHandler(async (req, res, next) => {
  const { page, limit, skip } = getPaginationData(req.query);

  let query = {};
  if (req.user.role === 'doctor') {
    query.doctorId = req.user._id;
  } else if (req.user.role === 'patient') {
    const { Patient } = await import('../models/Patient.model.js');
    const patientDoc = await Patient.findOne({
      $or: [
        { createdBy: req.user._id },
        { 'contact.email': req.user.email },
        { name: req.user.name },
      ],
    });
    query.patientId = patientDoc ? patientDoc._id : req.user._id;
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
