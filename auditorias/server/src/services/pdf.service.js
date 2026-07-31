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
