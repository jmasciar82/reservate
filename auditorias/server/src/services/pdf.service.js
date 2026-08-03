import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import r2Client from '../config/r2.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to fetch image buffer from Cloudinary URL or local file
const fetchImageBuffer = async (keyOrUrl) => {
  if (!keyOrUrl) return null;
  try {
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      const res = await fetch(keyOrUrl);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const localPath = path.join(process.cwd(), 'uploads', keyOrUrl);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching image buffer for ${keyOrUrl}:`, error);
    return null;
  }
};

export const generatePdf = async (audit) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const auditIdStr = audit.auditId || audit._id || 'AUD-000';
      const pdvStr = audit.pdvCode || audit.povCode || 'PDV-000';
      const userNameStr = audit.userName || (audit.user && audit.user.name) || 'Auditor';
      const userEmailStr = audit.userEmail || (audit.user && audit.user.email) || '';
      const dateVal = audit.date || audit.createdAt;
      const dateStr = dateVal ? new Date(dateVal).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

      // Header
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        try { doc.image(logoPath, 50, 45, { width: 100 }); } catch (e) {}
      } else {
        doc.fontSize(20).text('LOGO', 50, 45);
      }

      doc.fontSize(20).text('Reporte de Auditoría PDV', 200, 50, { align: 'right' });
      doc.moveDown(2);

      // Audit Info
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#e63946').text(`PUNTO DE VENTA (PDV): ${pdvStr}`);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#222222');
      doc.font('Helvetica-Bold').text('ID de Auditoría: ', { continued: true });
      doc.font('Helvetica').text(auditIdStr);

      doc.font('Helvetica-Bold').text('Auditor: ', { continued: true });
      doc.font('Helvetica').text(`${userNameStr} ${userEmailStr ? `(${userEmailStr})` : ''}`);

      doc.font('Helvetica-Bold').text('Fecha: ', { continued: true });
      doc.font('Helvetica').text(dateStr);

      if (audit.location && audit.location.latitude && audit.location.longitude) {
        const lat = audit.location.latitude.toFixed(6);
        const lng = audit.location.longitude.toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        doc.font('Helvetica-Bold').text('Ubicación GPS: ', { continued: true });
        doc.font('Helvetica').text(`${lat}, ${lng}`);
        doc.font('Helvetica-Bold').text('Enlace Google Maps: ', { continued: true });
        doc.font('Helvetica').fillColor('#0066cc').text(mapsUrl, { link: mapsUrl, underline: true });
        doc.fillColor('#222222');
      }
      doc.moveDown(0.8);

      // Observations
      doc.font('Helvetica-Bold').fontSize(11).text('Observaciones:');
      doc.font('Helvetica').fontSize(10).text(audit.observations || 'Sin observaciones.');
      doc.moveDown(1.5);

      // Before Images
      if (audit.images && audit.images.before && audit.images.before.length > 0) {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f1f2e').text(`Fotos Antes - PDV: ${pdvStr} (${auditIdStr})`, { align: 'center' });
        doc.moveDown(1);
        
        let x = 50;
        let y = 100;
        for (let i = 0; i < audit.images.before.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.before[i]);
          if (buffer) {
            try {
              doc.image(buffer, x, y, { width: 220, height: 220, fit: [220, 220] });
            } catch (imgErr) {
              console.error("PDFKit error drawing before image:", imgErr.message);
            }
          }
          x += 250;
          if (x > 300) {
            x = 50;
            y += 240;
          }
        }
      }

      // After Images
      if (audit.images && audit.images.after && audit.images.after.length > 0) {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f1f2e').text(`Fotos Después - PDV: ${pdvStr} (${auditIdStr})`, { align: 'center' });
        doc.moveDown(1);
        
        let x = 50;
        let y = 100;
        for (let i = 0; i < audit.images.after.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.after[i]);
          if (buffer) {
            try {
              doc.image(buffer, x, y, { width: 220, height: 220, fit: [220, 220] });
            } catch (imgErr) {
              console.error("PDFKit error drawing after image:", imgErr.message);
            }
          }
          x += 250;
          if (x > 300) {
            x = 50;
            y += 240;
          }
        }
      }

      // Footer
      try {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(9).fillColor('#666666').text(
            `PDV: ${pdvStr} | ID: ${auditIdStr} | Generado el: ${new Date().toLocaleString('es-ES')}`,
            50,
            doc.page.height - 40,
            { align: 'center' }
          );
        }
      } catch (e) {
        console.warn("Footer pagination warning:", e.message);
      }

      doc.end();
    } catch (error) {
      console.error("generatePdf error:", error);
      reject(error);
    }
  });
};

export const generateConsolidatedPdf = async (audits) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Cover / General Header
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#e63946').text('Reporte General de Auditorías PDV', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('#444444').text(`Total de Auditorías: ${audits.length} | Emisión: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
      doc.moveDown(1.5);

      for (let index = 0; index < audits.length; index++) {
        const audit = audits[index];
        const code = audit.pdvCode || audit.povCode || 'PDV-0000';
        const auditId = audit.auditId || audit._id || 'AUD-000';
        const dateStr = new Date(audit.date || audit.createdAt).toLocaleString('es-ES');
        const auditor = audit.userName || (audit.user && audit.user.name) || 'Admin';

        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        const headerY = doc.y;

        // Section Box Header
        doc.rect(40, headerY, 515, 28).fill('#1f1f2e');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`Punto de Venta: ${code}   |   ID: ${auditId}`, 52, headerY + 8);

        // Move Y cleanly below the dark header box
        doc.y = headerY + 36;

        // Details in crisp dark text
        doc.fillColor('#111111').fontSize(10);
        doc.font('Helvetica-Bold').text('Punto de Venta (PDV): ', 40, doc.y, { continued: true });
        doc.font('Helvetica').text(code);

        doc.font('Helvetica-Bold').text('Auditor: ', { continued: true });
        doc.font('Helvetica').text(auditor);

        doc.font('Helvetica-Bold').text('Fecha: ', { continued: true });
        doc.font('Helvetica').text(dateStr);

        if (audit.location && audit.location.latitude && audit.location.longitude) {
          const lat = audit.location.latitude.toFixed(6);
          const lng = audit.location.longitude.toFixed(6);
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          doc.font('Helvetica-Bold').text('GPS: ', { continued: true });
          doc.font('Helvetica').fillColor('#0066cc').text(`${lat}, ${lng} (Ver en Maps)`, { link: mapsUrl, underline: true });
          doc.fillColor('#111111');
        }

        doc.font('Helvetica-Bold').text('Observaciones: ', { continued: true });
        doc.font('Helvetica').text(audit.observations || 'Sin observaciones');
        doc.moveDown(0.8);

        // Render Before Photos
        const beforeImgs = audit.images?.before || [];
        if (beforeImgs.length > 0) {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#e63946').text('Fotos Antes:');
          doc.moveDown(0.3);
          let imgX = 40;
          let imgY = doc.y;
          for (let i = 0; i < beforeImgs.length; i++) {
            const buf = await fetchImageBuffer(beforeImgs[i]);
            if (buf) {
              try {
                doc.image(buf, imgX, imgY, { fit: [95, 95] });
                imgX += 105;
              } catch (e) {
                console.error("Error drawing before image in consolidated PDF:", e);
              }
            }
          }
          doc.y = imgY + 100;
        }

        // Render After Photos
        const afterImgs = audit.images?.after || [];
        if (afterImgs.length > 0) {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#2a9d8f').text('Fotos Después:');
          doc.moveDown(0.3);
          let imgX = 40;
          let imgY = doc.y;
          for (let i = 0; i < afterImgs.length; i++) {
            const buf = await fetchImageBuffer(afterImgs[i]);
            if (buf) {
              try {
                doc.image(buf, imgX, imgY, { fit: [95, 95] });
                imgX += 105;
              } catch (e) {
                console.error("Error drawing after image in consolidated PDF:", e);
              }
            }
          }
          doc.y = imgY + 100;
        }

        // Line separator
        doc.moveDown(1);
        doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);
      }

      // Page numbers footer
      try {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#888888').text(
            `Página ${i + 1} de ${pages.count} - Reporte Consolidado de Auditorías PDV`,
            40,
            doc.page.height - 30,
            { align: 'center' }
          );
        }
      } catch (e) {
        console.warn("Consolidated footer pagination warning:", e.message);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
