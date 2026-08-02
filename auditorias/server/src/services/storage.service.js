import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configure Cloudinary if environment variables exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

  // 1. Try Cloudinary if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
    try {
      const folder = path.dirname(key);
      const publicId = path.basename(key, path.extname(key));

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: publicId,
            resource_type: 'image',
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(optimizedBuffer);
      });

      return result.secure_url || key;
    } catch (error) {
      console.warn("Cloudinary upload error, falling back to local:", error.message);
    }
  }

  // 2. Local Storage Fallback
  const localPath = path.join(process.cwd(), 'uploads', key);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, optimizedBuffer);
  return key;
};

export const deleteObject = async (key) => {
  if (!key) return true;

  if (key.startsWith('http') && key.includes('cloudinary')) {
    try {
      // Extract public_id from Cloudinary URL
      const parts = key.split('/upload/')[1];
      if (parts) {
        const publicIdWithExt = parts.substring(parts.indexOf('/') + 1);
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.warn("Cloudinary delete warning:", error.message);
    }
  }

  const localPath = path.join(process.cwd(), 'uploads', key);
  if (fs.existsSync(localPath)) {
    try { fs.unlinkSync(localPath); } catch (e) {}
  }
  return true;
};

export const getPresignedUrl = async (key) => {
  if (!key) return null;

  // If already a full Cloudinary or HTTP URL, return as is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  // Local fallback endpoint (uses RENDER_EXTERNAL_URL in production)
  const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${key}`;
};

export const uploadPdf = async (fileBuffer, key) => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder') {
    try {
      const folder = path.dirname(key);
      const publicId = path.basename(key, path.extname(key));

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            public_id: publicId,
            resource_type: 'raw',
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });

      return result.secure_url || key;
    } catch (error) {
      console.warn("Cloudinary PDF upload error, falling back to local:", error.message);
    }
  }

  const localPath = path.join(process.cwd(), 'uploads', key);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, fileBuffer);
  return key;
};
