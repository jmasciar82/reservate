import api from '../services/api';
import { getPendingOfflineAudits, deleteOfflineAudit } from './offlineStorage';

// Helper to convert dataURL/Base64 to File object
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const syncAllPendingAudits = async (onProgress) => {
  const pending = await getPendingOfflineAudits();
  if (pending.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    try {
      if (onProgress) onProgress(i + 1, pending.length, item.pdvCode);

      // 1. Create audit
      const auditRes = await api.post('/api/audits', {
        pdvCode: item.pdvCode,
        povCode: item.pdvCode,
        observations: item.observations,
        location: item.location
      });

      const auditId = auditRes.data ? (auditRes.data._id || auditRes.data.auditId) : (auditRes._id || auditRes.auditId);

      // 2. Upload Before images
      if (item.beforeImages && item.beforeImages.length > 0) {
        for (let bIdx = 0; bIdx < item.beforeImages.length; bIdx++) {
          const imgData = item.beforeImages[bIdx];
          const fileObj = imgData.dataUrl 
            ? dataURLtoFile(imgData.dataUrl, imgData.name || `before_${bIdx}.jpg`)
            : imgData.file;

          if (fileObj) {
            const formDataPayload = new FormData();
            formDataPayload.append('image', fileObj);
            formDataPayload.append('type', 'before');
            await api.upload(`/api/audits/${auditId}/images/before`, formDataPayload);
          }
        }
      }

      // 3. Upload After images
      if (item.afterImages && item.afterImages.length > 0) {
        for (let aIdx = 0; aIdx < item.afterImages.length; aIdx++) {
          const imgData = item.afterImages[aIdx];
          const fileObj = imgData.dataUrl 
            ? dataURLtoFile(imgData.dataUrl, imgData.name || `after_${aIdx}.jpg`)
            : imgData.file;

          if (fileObj) {
            const formDataPayload = new FormData();
            formDataPayload.append('image', fileObj);
            formDataPayload.append('type', 'after');
            await api.upload(`/api/audits/${auditId}/images/after`, formDataPayload);
          }
        }
      }

      // Remove from IndexedDB once successfully synced
      await deleteOfflineAudit(item.id);
      syncedCount++;
    } catch (err) {
      console.error(`Error syncing offline audit ${item.pdvCode}:`, err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
};
