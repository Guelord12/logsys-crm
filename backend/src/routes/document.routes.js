const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocument);
router.post('/', upload.single('file'), documentController.uploadDocument);
router.put('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id/preview', documentController.previewDocument);
router.get('/:id/versions', documentController.getDocumentVersions);
router.post('/:id/versions', upload.single('file'), documentController.createNewVersion);

module.exports = router;