import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client from '../config/r2.js';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config();

const BUCKET = process.env.R2_BUCKET_NAME;

export const generateAuditKey = (povCode, auditId, type, index, originalName) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const yyyymmdd = `${year}${month}${day}`;
  const hhmmss = String(date.getHours()).padStart(2, '0') + 
                 String(date.getMinutes()).padStart(2, '0') + 
                 String(date.getSeconds()).padStart(2, '0');
  
  const ext = originalName.split('.').pop() || 'jpg';
  
  // Format: POV-CODE-YYYYMMDD-HHMMSS-tipo-fotoN.jpg
  const filename = `${povCode}-${yyyymmdd}-${hhmmss}-${type}-foto${index}.${ext}`;
  
  // Format: auditorias/{YYYY}/{MM}/{DD}/{POV-CODE}/{AUD-ID}/{filename}
  return `auditorias/${year}/${month}/${day}/${povCode}/${auditId}/${filename}`;
};

export const uploadImage = async (fileBuffer, key, mimeType) => {
  try {
    // Optionally resize/compress image with sharp
    const optimizedBuffer = await sharp(fileBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);
    return key;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error('No se pudo subir la imagen');
  }
};

export const deleteObject = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error('No se pudo eliminar el archivo');
  }
};

export const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return null;
  }
};

export const uploadPdf = async (fileBuffer, key) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    });

    await r2Client.send(command);
    return key;
  } catch (error) {
    console.error("Error uploading PDF to R2:", error);
    throw new Error('No se pudo subir el PDF');
  }
};
