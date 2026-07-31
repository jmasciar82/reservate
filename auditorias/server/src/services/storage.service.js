import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client from '../config/r2.js';
import dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

dotenv.config();

const BUCKET = process.env.R2_BUCKET_NAME;

export const generateAuditKey = (pdvCode, auditId, type, index, originalName) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const yyyymmdd = `${year}${month}${day}`;
  const hhmmss = String(date.getHours()).padStart(2, '0') + 
                 String(date.getMinutes()).padStart(2, '0') + 
                 String(date.getSeconds()).padStart(2, '0');
  
  const ext = originalName ? originalName.split('.').pop() : 'jpg';
  const cleanCode = (pdvCode || 'PDV-0000').toUpperCase();
  
  // Format: PDV-1323-YYYYMMDD-HHMMSS-tipo-fotoN.jpg
  const filename = `${cleanCode}-${yyyymmdd}-${hhmmss}-${type}-foto${index}.${ext}`;
  
  // Format: auditorias/{YYYY}/{MM}/{DD}/{PDV-CODE}/{AUD-ID}/{filename}
  return `auditorias/${year}/${month}/${day}/${cleanCode}/${auditId}/${filename}`;
};

export const uploadImage = async (fileBuffer, key, mimeType) => {
  const optimizedBuffer = await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  try {
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID !== 'placeholder') {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: mimeType,
      });
      await r2Client.send(command);
      return key;
    }
  } catch (error) {
    console.warn("R2 Upload warning, falling back to local storage:", error.message);
  }

  // Fallback local storage
  const localPath = path.join(process.cwd(), 'uploads', key);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, optimizedBuffer);
  return key;
};

export const deleteObject = async (key) => {
  try {
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID !== 'placeholder') {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });
      await r2Client.send(command);
    }
  } catch (error) {
    console.warn("R2 Delete warning:", error.message);
  }

  const localPath = path.join(process.cwd(), 'uploads', key);
  if (fs.existsSync(localPath)) {
    try { fs.unlinkSync(localPath); } catch (e) {}
  }
  return true;
};

export const getPresignedUrl = async (key, expiresIn = 3600) => {
  if (!key) return null;

  try {
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID !== 'placeholder') {
      const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });
      return await getSignedUrl(r2Client, command, { expiresIn });
    }
  } catch (error) {
    console.warn("R2 PresignedUrl warning:", error.message);
  }

  // Fallback to local endpoint
  const host = process.env.PORT || 5000;
  return `http://localhost:${host}/uploads/${key}`;
};

export const uploadPdf = async (fileBuffer, key) => {
  try {
    if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID !== 'placeholder') {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: 'application/pdf',
      });
      await r2Client.send(command);
      return key;
    }
  } catch (error) {
    console.warn("R2 PDF Upload warning:", error.message);
  }

  const localPath = path.join(process.cwd(), 'uploads', key);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, fileBuffer);
  return key;
};
