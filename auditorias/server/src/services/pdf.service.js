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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Header
      // Check if logo exists (placeholder for now)
      const logoPath = path.join(__dirname, '../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      } else {
        doc.fontSize(20).text('LOGO', 50, 45);
      }

      doc.fontSize(20).text('Reporte de Auditoría PDV', 200, 50, { align: 'right' });
      doc.moveDown(2);

      // Audit Info
      doc.fontSize(12).font('Helvetica-Bold').text('Información General:');
      doc.font('Helvetica').moveDown(0.5);
      doc.text(`ID de Auditoría: ${audit.auditId}`);
      doc.text(`Punto de Venta (PDV): ${audit.pdvCode || audit.povCode}`);
      doc.text(`Auditor: ${audit.userName} (${audit.userEmail})`);
      doc.text(`Fecha: ${new Date(audit.date).toLocaleDateString()}`);
      doc.moveDown(1);

      // Observations
      doc.font('Helvetica-Bold').text('Observaciones:');
      doc.font('Helvetica').moveDown(0.5);
      doc.text(audit.observations || 'Sin observaciones.');
      doc.moveDown(2);

      // Before Images
      if (audit.images && audit.images.before && audit.images.before.length > 0) {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(16).text('Fotos Antes', { align: 'center' });
        doc.moveDown(1);
        
        let x = 50;
        let y = 100;
        for (let i = 0; i < audit.images.before.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.before[i]);
          if (buffer) {
            doc.image(buffer, x, y, { width: 220, height: 220, fit: [220, 220] });
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
        doc.font('Helvetica-Bold').fontSize(16).text('Fotos Después', { align: 'center' });
        doc.moveDown(1);
        
        let x = 50;
        let y = 100;
        for (let i = 0; i < audit.images.after.length; i++) {
          const buffer = await fetchImageBuffer(audit.images.after[i]);
          if (buffer) {
            doc.image(buffer, x, y, { width: 220, height: 220, fit: [220, 220] });
          }
          x += 250;
          if (x > 300) {
            x = 50;
            y += 240;
          }
        }
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(
          `Generado el: ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateConsolidatedPdf = async (audits) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
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
        const dateStr = new Date(audit.date || audit.createdAt).toLocaleString('es-ES');
        const auditor = audit.userName || (audit.user && audit.user.name) || 'Admin';

        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        // Section Box Header
        doc.rect(40, doc.y, 515, 24).fill('#1f1f2e');
        doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(`Auditoría #${index + 1}: ${code} (${audit.auditId || audit._id})`, 50, doc.y - 18);
        doc.moveDown(1.2);

        // Details
        doc.fillColor('#222222').fontSize(10).font('Helvetica-Bold').text(`Punto de Venta: `, 40, doc.y, { continued: true });
        doc.font('Helvetica').text(code);
        doc.font('Helvetica-Bold').text(`Auditor: `, { continued: true });
        doc.font('Helvetica').text(auditor);
        doc.font('Helvetica-Bold').text(`Fecha: `, { continued: true });
        doc.font('Helvetica').text(dateStr);
        doc.font('Helvetica-Bold').text(`Observaciones: `, { continued: true });
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

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
