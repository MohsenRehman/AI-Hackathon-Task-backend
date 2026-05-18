import { Patient } from '../models/Patient.model.js';
import { User } from '../models/User.model.js';
import { Appointment } from '../models/Appointment.model.js';
import { Prescription } from '../models/Prescription.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getAdminAnalytics = asyncHandler(async (req, res, next) => {
  const totalPatients = await Patient.countDocuments();
  const totalDoctors = await User.countDocuments({ role: 'doctor' });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const totalAppointmentsThisMonth = await Appointment.countDocuments({
    createdAt: { $gte: startOfMonth },
  });

  const newPatientsLast30Days = await Patient.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  const appointmentsByStatusData = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const appointmentsByStatus = appointmentsByStatusData.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // Assuming top diagnoses from prescriptions
  const topDiagnoses = await Prescription.aggregate([
    { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { condition: '$_id', count: 1, _id: 0 } },
  ]);

  successResponse(res, 200, 'Admin analytics fetched', {
    totalPatients,
    totalDoctors,
    totalAppointmentsThisMonth,
    newPatientsLast30Days,
    appointmentsByStatus,
    topDiagnoses,
    revenueSimulation: {
      monthly: totalAppointmentsThisMonth * 50, // mock calculation
      annual: totalAppointmentsThisMonth * 50 * 12, // mock calculation
    },
  });
});

export const getDoctorAnalytics = asyncHandler(async (req, res, next) => {
  const doctorId = req.user._id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const startOfMonth = new Date(startOfDay);
  startOfMonth.setDate(1);

  const todayAppointments = await Appointment.countDocuments({
    doctorId,
    scheduledAt: { $gte: startOfDay },
  });

  const weekAppointments = await Appointment.countDocuments({
    doctorId,
    scheduledAt: { $gte: startOfWeek },
  });

  // Unique patients this doctor has created or seen
  const patientsServed = await Appointment.distinct('patientId', { doctorId });
  const totalPatientsServed = patientsServed.length;

  const prescriptionsIssuedThisMonth = await Prescription.countDocuments({
    doctorId,
    createdAt: { $gte: startOfMonth },
  });

  successResponse(res, 200, 'Doctor analytics fetched', {
    todayAppointments,
    weekAppointments,
    totalPatientsServed,
    prescriptionsIssuedThisMonth,
  });
});
