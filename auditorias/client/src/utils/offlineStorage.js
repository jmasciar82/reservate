// Helper for storing and syncing offline audits using IndexedDB

const DB_NAME = 'AuditoriasOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_audits';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveOfflineAudit = async (auditData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const record = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      pdvCode: auditData.pdvCode,
      observations: auditData.observations || '',
      location: auditData.location || null,
      beforeImages: auditData.beforeImages || [], // Base64 or ArrayBuffers
      afterImages: auditData.afterImages || [],
      createdAt: new Date().toISOString(),
      synced: false
    };

    const request = store.put(record);
    request.onsuccess = () => resolve(record);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingOfflineAudits = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const deleteOfflineAudit = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};
