import mongoose from 'mongoose';
import Audit from '../models/Audit.js';
import { generateAuditKey, uploadImage, deleteObject, getPresignedUrl, uploadPdf } from '../services/storage.service.js';
import { generatePdf, generateConsolidatedPdf } from '../services/pdf.service.js';

// Helper to find an audit by Mongo _id or custom auditId (e.g., AUD-20260731-0001)
const findAuditByIdOrCode = async (id) => {
  const isMongoId = mongoose.isValidObjectId(id);
  if (isMongoId) {
    const audit = await Audit.findById(id);
    if (audit) return audit;
  }
  return await Audit.findOne({ auditId: id });
};

export const createAudit = async (req, res) => {
  try {
    const code = req.body.pdvCode || req.body.povCode;
    const { observations, location } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Código PDV es requerido' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if an audit with this PDV code already exists
    const existingAudit = await Audit.findOne({ 
      $or: [
        { pdvCode: { $regex: `^${cleanCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } },
        { povCode: { $regex: `^${cleanCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } }
      ]
    });

    if (existingAudit) {
      return res.status(400).json({ 
        message: `El Punto de Venta ${cleanCode} ya fue auditado previamente (ID: ${existingAudit.auditId || existingAudit._id}). No se permiten PDV duplicados.` 
      });
    }

    const audit = new Audit({
      pdvCode: cleanCode,
      povCode: cleanCode,
      observations: observations || '',
      location: location || null,
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
    });

    const savedAudit = await audit.save();
    res.status(201).json(savedAudit);
  } catch (error) {
    console.error("createAudit error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe una auditoría registrada para ese Punto de Venta (PDV)' });
    }
    res.status(500).json({ message: 'Error al crear la auditoría' });
  }
};

export const getAudits = async (req, res) => {
  try {
    const { date, pdvCode, povCode, user } = req.query;
    let query = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    const searchCode = pdvCode || povCode;
    if (searchCode) {
      query.$or = [
        { pdvCode: { $regex: searchCode, $options: 'i' } },
        { povCode: { $regex: searchCode, $options: 'i' } }
      ];
    }
    if (user) query.user = user;

    const audits = await Audit.find(query).sort({ createdAt: -1 });
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener auditorías' });
  }
};

export const getAuditById = async (req, res) => {
  try {
    const audit = await findAuditByIdOrCode(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    // Generate presigned URLs for images
    const auditObj = audit.toObject();
    if (auditObj.images) {
      if (auditObj.images.before) {
        auditObj.images.beforeUrls = await Promise.all(
          auditObj.images.before.map(key => getPresignedUrl(key))
        );
      }
      if (auditObj.images.after) {
        auditObj.images.afterUrls = await Promise.all(
          auditObj.images.after.map(key => getPresignedUrl(key))
        );
      }
    }
    if (auditObj.pdfKey) {
      auditObj.pdfUrl = await getPresignedUrl(auditObj.pdfKey);
    }

    res.json(auditObj);
  } catch (error) {
    console.error("getAuditById error:", error);
    res.status(500).json({ message: 'Error al obtener la auditoría' });
  }
};

export const updateAudit = async (req, res) => {
  try {
    const { observations, pdvCode, povCode, status, location } = req.body;
    const audit = await findAuditByIdOrCode(req.params.id);

    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    if (observations !== undefined) audit.observations = observations;
    const newCode = pdvCode || povCode;
    if (newCode) {
      const cleanCode = newCode.trim().toUpperCase();
      const existingOther = await Audit.findOne({
        _id: { $ne: audit._id },
        $or: [
          { pdvCode: { $regex: `^${cleanCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } },
          { povCode: { $regex: `^${cleanCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } }
        ]
      });
      if (existingOther) {
        return res.status(400).json({
          message: `El Punto de Venta ${cleanCode} ya pertenece a otra auditoría existente (ID: ${existingOther.auditId}).`
        });
      }
      audit.pdvCode = cleanCode;
      audit.povCode = cleanCode;
    }
    if (status !== undefined) audit.status = status;
    if (location !== undefined) audit.location = location;

    const updatedAudit = await audit.save();
    res.json(updatedAudit);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la auditoría' });
  }
};

export const deleteAudit = async (req, res) => {
  try {
    if (req.user && req.user.role === 'Auditor') {
      return res.status(403).json({ message: 'Los auditores no tienen permiso para eliminar auditorías.' });
    }

    const audit = await findAuditByIdOrCode(req.params.id);

    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    // Delete associated before images
    if (audit.images && audit.images.before) {
      for (const key of audit.images.before) {
        await deleteObject(key);
      }
    }

    // Delete associated after images
    if (audit.images && audit.images.after) {
      for (const key of audit.images.after) {
        await deleteObject(key);
      }
    }

    // Delete PDF if exists
    if (audit.pdfKey) {
      await deleteObject(audit.pdfKey);
    }

    await Audit.findByIdAndDelete(audit._id);

    res.json({ message: 'Auditoría eliminada exitosamente' });
  } catch (error) {
    console.error("deleteAudit error:", error);
    res.status(500).json({ message: 'Error al eliminar la auditoría' });
  }
};

export const uploadAuditImage = async (req, res) => {
  try {
    const id = req.params.id;
    const rawType = req.params.type || req.body.type || 'before';
    
    const mappedType = (rawType === 'antes' || rawType === 'before') ? 'before' : 'after';

    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ninguna imagen' });
    }

    const audit = await findAuditByIdOrCode(id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    // Check limits
    if (mappedType === 'before' && audit.images.before.length >= 2) {
      return res.status(400).json({ message: 'Máximo 2 fotos "antes" permitidas' });
    }
    if (mappedType === 'after' && audit.images.after.length >= 3) {
      return res.status(400).json({ message: 'Máximo 3 fotos "después" permitidas' });
    }

    const index = audit.images[mappedType].length + 1;
    const s3TypeStr = mappedType === 'before' ? 'antes' : 'despues';
    const code = audit.pdvCode || audit.povCode;
    
    const key = generateAuditKey(code, audit.auditId, s3TypeStr, index, req.file.originalname);
    
    const uploadedKey = await uploadImage(req.file.buffer, key, req.file.mimetype);
    
    audit.images[mappedType].push(uploadedKey);
    await audit.save();

    const url = await getPresignedUrl(uploadedKey);

    res.json({ message: 'Imagen subida exitosamente', key, url, audit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
};

export const deleteAuditImage = async (req, res) => {
  try {
    if (req.user && req.user.role === 'Auditor') {
      return res.status(403).json({ message: 'Los auditores no tienen permiso para eliminar imágenes.' });
    }

    const { id, type, index } = req.params;
    
    const mappedType = (type === 'antes' || type === 'before') ? 'before' : 'after';
    const audit = await findAuditByIdOrCode(id);
    
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    const idx = parseInt(index);
    if (isNaN(idx) || idx < 0 || idx >= audit.images[mappedType].length) {
      return res.status(400).json({ message: 'Índice de imagen inválido' });
    }

    const key = audit.images[mappedType][idx];
    
    await deleteObject(key);
    
    audit.images[mappedType].splice(idx, 1);
    await audit.save();

    res.json({ message: 'Imagen eliminada exitosamente', audit });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la imagen' });
  }
};

export const finalizeAudit = async (req, res) => {
  try {
    const audit = await findAuditByIdOrCode(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    // Generate PDF
    const pdfBuffer = await generatePdf(audit);
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const code = audit.pdvCode || audit.povCode;
    const pdfKey = `auditorias/${year}/${month}/${day}/${code}/${audit.auditId}/${audit.auditId}.pdf`;
    
    const uploadedPdfKey = await uploadPdf(pdfBuffer, pdfKey);
    
    audit.pdfKey = uploadedPdfKey;
    await audit.save();

    res.json({ message: 'PDF generado exitosamente', audit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};

export const downloadPdf = async (req, res) => {
  try {
    const audit = await findAuditByIdOrCode(req.params.id);
    if (!audit) {
      return res.status(404).json({ message: 'Auditoría no encontrada' });
    }

    const pdfBuffer = await generatePdf(audit);
    const cleanCode = (audit.pdvCode || audit.povCode || 'PDV').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanId = (audit.auditId || audit._id || 'AUD').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `Auditoria_${cleanCode}_${cleanId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Download PDF error details:", error);
    res.status(500).json({ message: 'Error al generar el PDF', details: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await Audit.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const today = await Audit.countDocuments({ createdAt: { $gte: todayStart } });
    
    res.json({ total, today });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const downloadConsolidatedPdf = async (req, res) => {
  try {
    const audits = await Audit.find().sort({ createdAt: -1 });
    if (audits.length === 0) {
      return res.status(404).json({ message: 'No hay auditorías para generar el reporte' });
    }

    const pdfBuffer = await generateConsolidatedPdf(audits);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Reporte_General_Auditorias_${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("downloadConsolidatedPdf error:", error);
    res.status(500).json({ message: 'Error al generar el reporte PDF general' });
  }
};

export const getStorageUsage = async (req, res) => {
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
      const usage = await cloudinary.api.usage();
      
      const creditsUsed = usage.credits?.usage || 0;
      const creditsLimit = usage.credits?.limit || 25;
      const percent = Math.min(100, Math.max(0.1, Math.round((creditsUsed / creditsLimit) * 100 * 10) / 10));
      
      const storageUsedBytes = usage.storage?.usage || 0;
      const usedMB = (storageUsedBytes / (1024 * 1024)).toFixed(1);
      
      return res.json({
        plan: usage.plan || 'Free',
        usedMB,
        creditsUsed: creditsUsed.toFixed(2),
        creditsLimit,
        percent,
      });
    }

    const count = await Audit.countDocuments();
    const estMB = (count * 2.5).toFixed(1);
    const estPercent = Math.min(100, Math.max(0.1, parseFloat((count * 0.1).toFixed(1))));
    
    res.json({
      plan: 'Gratuito',
      usedMB: estMB,
      creditsUsed: (count * 0.05).toFixed(2),
      creditsLimit: 25,
      percent: estPercent
    });
  } catch (error) {
    console.warn("Storage usage warning:", error.message);
    const count = await Audit.countDocuments();
    res.json({
      plan: 'Gratuito',
      usedMB: (count * 2.5).toFixed(1),
      creditsUsed: (count * 0.05).toFixed(2),
      creditsLimit: 25,
      percent: Math.min(100, Math.max(0.2, parseFloat((count * 0.1).toFixed(1))))
    });
  }
};
