import React, { useRef, useState } from 'react';
import { compressImage } from '../utils/imageCompressor';
import './ImageUploader.css';

const ImageUploader = ({ images, onAdd, onRemove, maxImages, label }) => {
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
          <div 
            className="drop-zone" 
            onClick={() => fileInputRef.current.click()}
            onDragOver={preventDefault}
            onDrop={handleDrop}
          >
            <span className="camera-icon">📷</span>
            <span className="drop-text">{isCompressing ? 'Comprimiendo...' : 'Agregar Foto'}</span>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              multiple
              hidden 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
