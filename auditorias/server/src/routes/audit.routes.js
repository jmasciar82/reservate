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
  getStats
} from '../controllers/audit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/', getAudits);
router.post('/', createAudit);
router.get('/:id', getAuditById);
router.patch('/:id', updateAudit);

router.post('/:id/images/:type', upload.single('image'), uploadAuditImage);
router.post('/:id/images', upload.single('image'), uploadAuditImage);
router.delete('/:id/images/:type/:index', deleteAuditImage);

router.post('/:id/finalize', finalizeAudit);
router.get('/:id/pdf', downloadPdf);

export default router;
