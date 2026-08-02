import React, { useRef, useState } from 'react';
import { compressImage } from '../utils/imageCompressor';
import './ImageUploader.css';

const ImageUploader = ({ images, onAdd, onRemove, maxImages, label }) => {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsCompressing(true);
    for (let file of files) {
      if (images.length >= maxImages) break;
      try {
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);
        onAdd({ file: compressedFile, previewUrl });
      } catch (error) {
        console.error('Error al procesar imagen', error);
      }
    }
    setIsCompressing(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (images.length >= maxImages) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const dummyEvent = { target: { files } };
    handleFileChange(dummyEvent);
  };

  const preventDefault = (e) => e.preventDefault();

  return (
    <div className="image-uploader-container">
      <label className="form-label">{label} ({images.length}/{maxImages})</label>
      
      <div className="image-grid">
        {images.map((img, idx) => (
          <div key={idx} className="image-preview">
            <img src={img.previewUrl || img.url} alt={`Preview ${idx}`} />
            <button type="button" className="remove-btn" onClick={() => onRemove(idx)}>
              ✕
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <div className="upload-options">
            {/* Direct Camera Button */}
            <div 
              className="drop-zone camera-zone" 
              onClick={() => cameraInputRef.current.click()}
              title="Abrir Cámara Principal"
            >
              <span className="camera-icon">📷</span>
              <span className="drop-text">{isCompressing ? 'Comprimiendo...' : 'Tomar Foto'}</span>
              <input 
                type="file" 
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                hidden 
              />
            </div>

            {/* Gallery / File Picker Button */}
            <div 
              className="drop-zone gallery-zone" 
              onClick={() => fileInputRef.current.click()}
              onDragOver={preventDefault}
              onDrop={handleDrop}
              title="Seleccionar de Galería / Archivos"
            >
              <span className="camera-icon">📁</span>
              <span className="drop-text">{isCompressing ? 'Comprimiendo...' : 'Elegir Archivos'}</span>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                hidden 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
