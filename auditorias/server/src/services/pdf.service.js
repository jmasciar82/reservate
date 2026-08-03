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

const drawHeaderBanner = (doc, titleText = 'REPORTE DE AUDITORÍA PDV', subtitleText = 'SISTEMA DE CONTROL DE PUNTOS DE VENTA') => {
  doc.save();
  
  // Header background box (Dark Charcoal #14141f)
  doc.rect(0, 0, 595.28, 75).fill('#14141f');

  // Dalt Logo (Left side)
  const daltLogoPath = path.join(__dirname, '../assets/dalt_logo.png');
  const fallbackLogoPath = path.join(__dirname, '../assets/logo.png');

  if (fs.existsSync(daltLogoPath)) {
    try {
      doc.image(daltLogoPath, 35, 20, { height: 35 });
    } catch (e) {
      console.error("Error embedding Dalt logo in PDF:", e);
    }
  } else if (fs.existsSync(fallbackLogoPath)) {
    try {
      doc.image(fallbackLogoPath, 35, 20, { height: 35 });
    } catch (e) {}
  } else {
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('DALT', 35, 26);
  }

  // Header Title & Subtitle (Right side)
  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(titleText, 180, 22, { width: 380, align: 'right' });
  doc.fillColor('#a0a0b8').fontSize(8.5).font('Helvetica').text(subtitleText, 180, 42, { width: 380, align: 'right' });

  // Accent Line (Red #e63946)
  doc.rect(0, 75, 595.28, 4).fill('#e63946');

  doc.restore();
  doc.y = 98;
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

      // Page 1 Header
      drawHeaderBanner(doc, 'REPORTE DE AUDITORÍA PDV', `PDV: ${pdvStr}  |  ID: ${auditIdStr}`);

      // Audit Info Title Box
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#e63946').text(`PUNTO DE VENTA (PDV): ${pdvStr}`, 50, 98);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#222222');
      doc.font('Helvetica-Bold').text('ID de Auditoría: ', { continued: true });
      doc.font('Helvetica').text(auditIdStr);

      doc.font('Helvetica-Bold').text('Auditor: ', { continued: true });
      doc.font('Helvetica').text(`${userNameStr} ${userEmailStr ? `(${userEmailStr})` : ''}`);

      doc.font('Helvetica-Bold').text('Fecha de Auditoría: ', { continued: true });
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
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#14141f').text('Observaciones:');
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(audit.observations || 'Sin observaciones.');
      doc.moveDown(1.5);

      // Before Images Page
      if (audit.images && audit.images.before && audit.images.before.length > 0) {
        doc.addPage();
        drawHeaderBanner(doc, 'REGISTRO FOTOGRÁFICO - ANTES', `PDV: ${pdvStr}  |  ${audit.images.before.length} FOTOS`);
        
        let x = 50;
        let y = 110;
        for (let i = 0; i < audit.images.before.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.before[i]);
          if (buffer) {
            try {
              doc.image(buffer, x, y, { width: 230, height: 230, fit: [230, 230] });
              doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666').text(`Foto Antes #${i + 1}`, x, y + 235, { width: 230, align: 'center' });
            } catch (imgErr) {
              console.error("PDFKit error drawing before image:", imgErr.message);
            }
          }
          x += 250;
          if (x > 300) {
            x = 50;
            y += 260;
          }
        }
      }

      // After Images Page
      if (audit.images && audit.images.after && audit.images.after.length > 0) {
        doc.addPage();
        drawHeaderBanner(doc, 'REGISTRO FOTOGRÁFICO - DESPUÉS', `PDV: ${pdvStr}  |  ${audit.images.after.length} FOTOS`);
        
        let x = 50;
        let y = 110;
        for (let i = 0; i < audit.images.after.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.after[i]);
          if (buffer) {
            try {
              doc.image(buffer, x, y, { width: 230, height: 230, fit: [230, 230] });
              doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666').text(`Foto Después #${i + 1}`, x, y + 235, { width: 230, align: 'center' });
            } catch (imgErr) {
              console.error("PDFKit error drawing after image:", imgErr.message);
            }
          }
          x += 250;
          if (x > 300) {
            x = 50;
            y += 260;
          }
        }
      }

      // Footer Pagination
      try {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8.5).fillColor('#777777').text(
            `Página ${i + 1} de ${pages.count}  |  PDV: ${pdvStr}  |  DALT AUDITORÍAS - DOCUMENTO OFICIAL`,
            50,
            doc.page.height - 35,
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
      drawHeaderBanner(doc, 'REPORTE GENERAL DE AUDITORÍAS', `TOTAL: ${audits.length} AUDITORÍAS  |  EMISIÓN: ${new Date().toLocaleDateString('es-ES')}`);

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
