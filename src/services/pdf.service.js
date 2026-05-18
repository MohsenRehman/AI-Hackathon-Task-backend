import PDFDocument from 'pdfkit';

export const generatePrescriptionPDF = (prescription) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc
        .fontSize(20)
        .text('Clinic Management SaaS', { align: 'center' })
        .moveDown();
      
      doc
        .fontSize(12)
        .text(`Doctor: Dr. ${prescription.doctorId.name}`)
        .text(`Specialization: ${prescription.doctorId.role}`) // could add specialization if available
        .moveDown();

      // Patient Info
      doc
        .fontSize(14)
        .text('Patient Information', { underline: true })
        .fontSize(12)
        .text(`Name: ${prescription.patientId.name}`)
        .text(`Age/Gender: ${prescription.patientId.age} / ${prescription.patientId.gender}`)
        .text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`)
        .moveDown();

      // Diagnosis
      doc
        .fontSize(14)
        .text('Diagnosis', { underline: true })
        .fontSize(12)
        .text(prescription.diagnosis)
        .moveDown();

      // Medicines
      doc
        .fontSize(14)
        .text('Prescription', { underline: true })
        .moveDown();

      prescription.medicines.forEach((med, index) => {
        doc
          .fontSize(12)
          .text(`${index + 1}. ${med.name}`)
          .fontSize(10)
          .text(`   Dosage: ${med.dosage} | Freq: ${med.frequency} | Duration: ${med.duration}`)
          .text(`   Instructions: ${med.instructions || 'N/A'}`)
          .moveDown(0.5);
      });

      doc.moveDown();

      if (prescription.notes) {
        doc
          .fontSize(12)
          .text('Notes:', { underline: true })
          .fontSize(10)
          .text(prescription.notes)
          .moveDown();
      }

      if (prescription.followUpDate) {
        doc
          .fontSize(12)
          .text(`Follow-up Date: ${new Date(prescription.followUpDate).toLocaleDateString()}`)
          .moveDown();
      }

      // Footer
      doc
        .fontSize(10)
        .text('This is an AI Clinic Management generated prescription.', { align: 'center', align: 'bottom' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
