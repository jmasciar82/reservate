import express from 'express';
import { 
  createAudit, 
  getAudits, 
  getAuditById, 
  updateAudit, 
  uploadAuditImage, 
  deleteAuditImage,
  finalizeAudit,
  downloadPdf,
  downloadConsolidatedPdf,
  deleteAudit,
  getStats,
  getStorageUsage
} from '../controllers/audit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/storage/usage', getStorageUsage);
router.get('/report/pdf', downloadConsolidatedPdf);
router.get('/', getAudits);
router.post('/', createAudit);
router.get('/:id', getAuditById);
router.patch('/:id', updateAudit);
router.delete('/:id', deleteAudit);

router.post('/:id/images/:type', upload.single('image'), uploadAuditImage);
router.post('/:id/images', upload.single('image'), uploadAuditImage);
router.delete('/:id/images/:type/:index', deleteAuditImage);

router.post('/:id/finalize', finalizeAudit);
router.get('/:id/pdf', downloadPdf);

export default router;
