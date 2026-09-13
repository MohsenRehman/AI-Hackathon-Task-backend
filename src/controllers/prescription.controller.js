import { Prescription } from '../models/Prescription.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import { getPaginationData, getPaginationMeta } from '../utils/pagination.js';
import { generatePrescriptionPDF } from '../services/pdf.service.js';
import { uploadBufferToCloudinary } from '../services/upload.service.js';
import { AppError } from '../utils/AppError.js';

export const createPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.create({
    ...req.body,
    doctorId: req.user._id,
  });

  // Generate PDF and upload
  const populated = await Prescription.findById(prescription._id)
    .populate('patientId', 'name age gender')
    .populate('doctorId', 'name role');

  const pdfBuffer = await generatePrescriptionPDF(populated);
  const uploadResult = await uploadBufferToCloudinary(pdfBuffer, 'prescriptions');

  prescription.pdfUrl = uploadResult.secure_url;
  await prescription.save();

  // If the pdfUrl is a Cloudinary fallback placeholder, return local download route for real-time PDF generation
  const responseData = prescription.toJSON();
  if (responseData.pdfUrl && responseData.pdfUrl.includes('v1574059400/sample.jpg')) {
    responseData.pdfUrl = `/prescriptions/${prescription._id}/download`;
  }

  successResponse(res, 201, 'Prescription created successfully', responseData);
});

export const getPrescriptions = asyncHandler(async (req, res, next) => {
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

  const prescriptions = await Prescription.find(query)
    .populate('patientId', 'name')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Prescription.countDocuments(query);

  successResponse(res, 200, 'Prescriptions fetched', prescriptions, getPaginationMeta(total, page, limit));
});

export const downloadPrescription = asyncHandler(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'name age gender')
    .populate('doctorId', 'name role');

  if (!prescription) {
    return next(new AppError('Prescription not found', 404));
  }

  // If a real Cloudinary URL exists, use it. Otherwise, stream the generated PDF on the fly.
  if (prescription.pdfUrl && !prescription.pdfUrl.includes('v1574059400/sample.jpg')) {
    return res.redirect(prescription.pdfUrl);
  }

  const pdfBuffer = await generatePrescriptionPDF(prescription);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="prescription_${prescription._id}.pdf"`);
  res.send(pdfBuffer);
});
