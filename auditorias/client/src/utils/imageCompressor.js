import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.15, // Max ~150 KB
    maxWidthOrHeight: 1024, // 1024px is crystal clear for PDF and mobile displays
    initialQuality: 0.75,
    useWebWorker: true,
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file;
  }
};
