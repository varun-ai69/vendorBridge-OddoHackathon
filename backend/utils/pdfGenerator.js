const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = async (docType, docNumber, details) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      const fileName = `${docNumber}.pdf`;
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);

      // Simple Styling
      doc
        .fillColor('#444444')
        .fontSize(20)
        .text(`VendorBridge - ${docType.toUpperCase()}`, { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Document Reference: ${docNumber}`, { align: 'center' })
        .moveDown(2);

      doc.fontSize(14).text('Key Details', { underline: true }).moveDown(0.5);

      doc.fontSize(12).fillColor('#000000');
      for (const [key, value] of Object.entries(details)) {
        if (value) {
          doc.text(`${key}: ${value}`);
          doc.moveDown(0.5);
        }
      }

      doc.moveDown();
      doc.fontSize(10).fillColor('gray').text('This is a system generated document. No signature required.', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        // Return exactly the public-facing URL path without explicit CDN markers.
        // Assuming the app mounts /uploads statically in server.js
        resolve(`/uploads/${fileName}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePDF };
