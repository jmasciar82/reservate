import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const localPath = path.join(process.cwd(), 'uploads', keyOrUrl);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching image buffer for ${keyOrUrl}:`, error.message);
    return null;
  }
};

const drawHeaderBanner = (doc, titleText = 'REPORTE DE AUDITORÍA PDV', subtitleText = 'SISTEMA DE CONTROL DE PUNTOS DE VENTA') => {
  doc.save();
  
  // Header background box (Dark Charcoal #14141f)
  doc.rect(0, 0, 595.28, 65).fill('#14141f');

  // Dalt Logo (Left side)
  const daltLogoPath = path.join(__dirname, '../assets/dalt_logo.png');
  const fallbackLogoPath = path.join(__dirname, '../assets/logo.png');

  if (fs.existsSync(daltLogoPath)) {
    try {
      doc.image(daltLogoPath, 35, 16, { height: 32 });
    } catch (e) {
      console.error("Error embedding Dalt logo in PDF:", e);
    }
  } else if (fs.existsSync(fallbackLogoPath)) {
    try {
      doc.image(fallbackLogoPath, 35, 16, { height: 32 });
    } catch (e) {}
  } else {
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('DALT', 35, 22);
  }

  // Header Title & Subtitle (Right side)
  doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(titleText, 180, 18, { width: 380, align: 'right' });
  doc.fillColor('#a0a0b8').fontSize(8).font('Helvetica').text(subtitleText, 180, 36, { width: 380, align: 'right' });

  // Accent Line (Red #e63946)
  doc.rect(0, 65, 595.28, 3).fill('#e63946');

  doc.restore();
  doc.y = 85;
};

export const generatePdf = async (audit) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const rawCode = audit.pdvCode || audit.povCode || '';
      const pdvNumber = rawCode.replace(/^PDV-/i, '').trim() || rawCode;

      // Page 1 Header
      drawHeaderBanner(doc, 'REPORTE DE AUDITORÍA', `PUNTO DE VENTA: ${pdvNumber}`);

      // PDV Number
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#e63946').text(`Punto de Venta: ${pdvNumber}`, 40, 85, { width: 515 });
      doc.moveDown(0.6);

      // Observations
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#14141f').text('Observaciones:', { width: 515 });
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(audit.observations || 'Sin observaciones.', { width: 515 });
      doc.moveDown(1.2);

      // Collect all valid image buffers first
      const rawImages = [
        ...(audit.images?.before || []),
        ...(audit.images?.after || [])
      ];

      const validBuffers = [];
      for (const imgUrl of rawImages) {
        const buf = await fetchImageBuffer(imgUrl);
        if (buf) validBuffers.push(buf);
      }

      if (validBuffers.length > 0) {
        let x = 40;
        let y = doc.y;

        // If not enough room on page 1 for the first image row, add page
        if (y + 250 > doc.page.height - 50) {
          doc.addPage();
          drawHeaderBanner(doc, 'REGISTRO FOTOGRÁFICO', `PUNTO DE VENTA: ${pdvNumber}  |  ${validBuffers.length} FOTOS`);
          x = 40;
          y = 85;
        }

        for (let i = 0; i < validBuffers.length; i++) {
          // Check if we need a new page for next row (every 2 images)
          if (i > 0 && i % 2 === 0) {
            x = 40;
            y += 260;
          }

          if (y + 250 > doc.page.height - 50) {
            doc.addPage();
            drawHeaderBanner(doc, 'REGISTRO FOTOGRÁFICO', `PUNTO DE VENTA: ${pdvNumber}`);
            x = 40;
            y = 85;
          }

          const buf = validBuffers[i];
          try {
            doc.image(buf, x, y, { width: 245, height: 235, fit: [245, 235] });
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#666666').text(`Foto #${i + 1}`, x, y + 238, { width: 245, align: 'center' });
          } catch (imgErr) {
            console.error("PDFKit error drawing image:", imgErr.message);
          }

          if (i % 2 === 0) {
            x += 265;
          }
        }
      }

      // Footer Pagination
      try {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#777777').text(
            `Página ${i + 1} de ${pages.count}  |  PV: ${pdvNumber}  |  DALT AUDITORÍAS`,
            40,
            doc.page.height - 30,
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
        const rawCode = audit.pdvCode || audit.povCode || '';
        const pdvNumber = rawCode.replace(/^PDV-/i, '').trim() || rawCode;

        // Pre-fetch valid image buffers for this audit
        const rawImgs = [...(audit.images?.before || []), ...(audit.images?.after || [])];
        const validImgs = [];
        for (const imgUrl of rawImgs) {
          const buf = await fetchImageBuffer(imgUrl);
          if (buf) validImgs.push(buf);
        }

        // Calculate approximate height needed for this audit
        const imageRows = Math.ceil(validImgs.length / 4);
        const estimatedHeight = 70 + (imageRows * 110);

        // Check if current page has enough space; if not, add page
        if (doc.y + estimatedHeight > doc.page.height - 50 && doc.y > 100) {
          doc.addPage();
          drawHeaderBanner(doc, 'REPORTE GENERAL DE AUDITORÍAS', `PÁGINA ${index + 1}`);
        }

        const headerY = doc.y;

        // Section Box Header
        doc.rect(40, headerY, 515, 26).fill('#1f1f2e');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(`Punto de Venta: ${pdvNumber}`, 52, headerY + 7);

        // Move Y cleanly below section box
        doc.y = headerY + 32;

        // Observations
        doc.fillColor('#111111').fontSize(9.5);
        doc.font('Helvetica-Bold').text('Observaciones: ', 40, doc.y, { continued: true });
        doc.font('Helvetica').text(audit.observations || 'Sin observaciones');
        doc.moveDown(0.5);

        // Render images grid (4 per row)
        if (validImgs.length > 0) {
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#666666').text('Fotos:');
          doc.moveDown(0.3);

          let imgX = 40;
          let imgY = doc.y;

          for (let i = 0; i < validImgs.length; i++) {
            if (i > 0 && i % 4 === 0) {
              imgX = 40;
              imgY += 105;
            }

            if (imgY + 100 > doc.page.height - 40) {
              doc.addPage();
              drawHeaderBanner(doc, 'REPORTE GENERAL DE AUDITORÍAS', `PV: ${pdvNumber}`);
              imgX = 40;
              imgY = 85;
            }

            try {
              doc.image(validImgs[i], imgX, imgY, { fit: [95, 95] });
            } catch (e) {
              console.error("Error drawing image in consolidated PDF:", e);
            }
            imgX += 105;
          }
          doc.y = imgY + 105;
        }

        // Line separator
        doc.moveDown(0.5);
        doc.strokeColor('#e0e0e0').lineWidth(0.8).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.8);
      }

      // Page numbers footer
      try {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#888888').text(
            `Página ${i + 1} de ${pages.count} - Reporte Consolidado de Auditorías PDV`,
            40,
            doc.page.height - 25,
            { align: 'center' }
          );
        }
      } catch (e) {
        console.warn("Consolidated footer pagination warning:", e.message);
      }

      doc.end();
    } catch (error) {
      console.error("generateConsolidatedPdf error:", error);
      reject(error);
    }
  });
};
