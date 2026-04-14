const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { uploadToStorage, deleteFromStorage, getSignedUrl } = require('../services/storage.service');
const { processOCR } = require('../services/ocr.service');
const fs = require('fs-extra');
const path = require('path');

const { Document, User, Company, AuditLog } = db;

/**
 * Helper pour obtenir la condition companyId
 * Admin système (companyId = null) voit toutes les entreprises
 */
const getCompanyWhere = (user) => {
  if (user.isSystemAdmin && !user.companyId) {
    return {};
  }
  return { companyId: user.companyId };
};

/**
 * Upload de document
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const file = req.file;
    const {
      title,
      description,
      documentType,
      category,
      tags,
      accessLevel = 'INTERNAL',
      relatedEntityType,
      relatedEntityId
    } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Fichier requis'
      });
    }

    // Gestion de l'admin système : companyId peut être null
    const companyId = req.user.isSystemAdmin && !req.user.companyId ? null : req.user.companyId;

    // Upload vers le stockage
    const storagePath = await uploadToStorage(file, `documents/${companyId || 'system'}`);
    
    // Générer le code document
    const documentCode = `DOC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Créer le document
    const document = await Document.create({
      companyId: companyId,
      documentCode,
      title: title || file.originalname,
      description,
      documentType,
      category,
      tags: tags ? JSON.parse(tags) : [],
      filename: path.basename(storagePath),
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileExtension: path.extname(file.originalname),
      storagePath,
      accessLevel,
      relatedEntityType,
      relatedEntityId,
      uploadedBy: req.user.id
    });

    // OCR pour les images et PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      processOCR(document.id, storagePath).then(async (ocrText) => {
        if (ocrText) {
          await document.update({ ocrText });
          
          await db.sequelize.query(`
            UPDATE documents 
            SET indexed_content = to_tsvector('french', $1)
            WHERE id = $2
          `, {
            bind: [ocrText, document.id]
          });
        }
      }).catch(err => {
        logger.error('Erreur OCR:', err);
      });
    }

    // Nettoyer le fichier temporaire
    await fs.remove(file.path);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      companyId: companyId,
      actionType: 'CREATE',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.title,
      actionDescription: `Upload du document ${document.originalFilename}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: document
    });

  } catch (error) {
    logger.error('Erreur upload document:', error);
    next(error);
  }
};

/**
 * Récupérer les documents
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      documentType,
      category,
      accessLevel,
      uploadedBy,
      relatedEntityType,
      relatedEntityId,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    // Filtres d'accès pour les utilisateurs non-admin
    if (!req.user.isSystemAdmin && !req.user.isCompanyAdmin) {
      where[Op.or] = [
        { accessLevel: { [Op.in]: ['PUBLIC', 'INTERNAL'] } },
        { uploadedBy: req.user.id }
      ];
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { originalFilename: { [Op.iLike]: `%${search}%` } },
        { ocrText: { [Op.iLike]: `%${search}%` } },
        db.sequelize.where(
          db.sequelize.fn('to_tsvector', 'french', db.sequelize.col('indexed_content')),
          '@@',
          db.sequelize.fn('plainto_tsquery', 'french', search)
        )
      ];
    }

    if (documentType) where.documentType = documentType;
    if (category) where.category = category;
    if (accessLevel) where.accessLevel = accessLevel;
    if (uploadedBy) where.uploadedBy = uploadedBy;
    if (relatedEntityType) where.relatedEntityType = relatedEntityType;
    if (relatedEntityId) where.relatedEntityId = relatedEntityId;

    const { count, rows: documents } = await Document.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'fullName', 'email']
      }, {
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération documents:', error);
    next(error);
  }
};

/**
 * Récupérer un document par ID
 */
exports.getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const document = await Document.findOne({
      where: {
        id,
        ...whereCompany
      },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'fullName', 'email']
      }, {
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier l'accès
    if (document.accessLevel === 'RESTRICTED' && 
        document.uploadedBy !== req.user.id && 
        !req.user.isCompanyAdmin && 
        !req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Incrémenter le compteur de vues
    await document.increment('viewCount');
    await document.update({ lastAccessedAt: new Date() });

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    logger.error('Erreur récupération document:', error);
    next(error);
  }
};

/**
 * Télécharger un document
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const document = await Document.findOne({
      where: {
        id,
        ...whereCompany
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier l'accès
    if (document.accessLevel === 'RESTRICTED' && 
        document.uploadedBy !== req.user.id && 
        !req.user.isCompanyAdmin && 
        !req.user.isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Incrémenter le compteur de téléchargements
    await document.increment('downloadCount');

    // URL signée ou téléchargement direct
    if (process.env.STORAGE_PROVIDER === 's3') {
      const signedUrl = await getSignedUrl(document.storagePath);
      return res.json({
        success: true,
        data: { downloadUrl: signedUrl }
      });
    }

    // Téléchargement direct pour stockage local
    if (!await fs.pathExists(document.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    res.download(document.storagePath, document.originalFilename);

  } catch (error) {
    logger.error('Erreur téléchargement document:', error);
    next(error);
  }
};

/**
 * Mettre à jour un document
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const whereCompany = getCompanyWhere(req.user);

    const document = await Document.findOne({
      where: {
        id,
        ...whereCompany
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier les permissions
    const canUpdate = document.uploadedBy === req.user.id || 
                     req.user.isCompanyAdmin || 
                     req.user.isSystemAdmin;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour modifier ce document'
      });
    }

    const allowedFields = ['title', 'description', 'documentType', 'category', 'tags', 'accessLevel'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (updateData.tags && typeof updateData.tags === 'string') {
      filteredData.tags = JSON.parse(updateData.tags);
    }

    await document.update(filteredData);

    await AuditLog.create({
      userId: req.user.id,
      companyId: document.companyId,
      actionType: 'UPDATE',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.title,
      actionDescription: `Mise à jour du document ${document.originalFilename}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    logger.error('Erreur mise à jour document:', error);
    next(error);
  }
};

/**
 * Supprimer un document
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const document = await Document.findOne({
      where: {
        id,
        ...whereCompany
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier les permissions
    const canDelete = document.uploadedBy === req.user.id || 
                     req.user.isCompanyAdmin || 
                     req.user.isSystemAdmin;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour supprimer ce document'
      });
    }

    // Supprimer du stockage
    await deleteFromStorage(document.storagePath);

    // Supprimer de la base
    await document.destroy();

    await AuditLog.create({
      userId: req.user.id,
      companyId: document.companyId,
      actionType: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityName: document.title,
      actionDescription: `Suppression du document ${document.originalFilename}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    logger.error('Erreur suppression document:', error);
    next(error);
  }
};

/**
 * Prévisualiser un document
 */
exports.previewDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const document = await Document.findOne({
      where: {
        id,
        ...whereCompany
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier l'accès
    if (document.accessLevel === 'RESTRICTED' && 
        document.uploadedBy !== req.user.id && 
        !req.user.isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Servir le fichier pour prévisualisation
    const mimeType = document.mimeType;
    
    if (!await fs.pathExists(document.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }
    
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      res.sendFile(document.storagePath);
    } else {
      res.json({
        success: true,
        data: {
          id: document.id,
          title: document.title,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          previewAvailable: false
        }
      });
    }

  } catch (error) {
    logger.error('Erreur prévisualisation document:', error);
    next(error);
  }
};

/**
 * Récupérer les versions d'un document
 */
exports.getDocumentVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const versions = await Document.findAll({
      where: {
        ...whereCompany,
        [Op.or]: [
          { id },
          { previousVersionId: id }
        ]
      },
      order: [['versionNumber', 'DESC']]
    });

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    logger.error('Erreur récupération versions:', error);
    next(error);
  }
};

/**
 * Créer une nouvelle version d'un document
 */
exports.createNewVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const whereCompany = getCompanyWhere(req.user);

    const previousDocument = await Document.findOne({
      where: {
        id,
        ...whereCompany
      }
    });

    if (!previousDocument) {
      return res.status(404).json({
        success: false,
        message: 'Document original non trouvé'
      });
    }

    // Upload de la nouvelle version
    const storagePath = await uploadToStorage(file, `documents/${previousDocument.companyId || 'system'}`);

    const newDocument = await Document.create({
      companyId: previousDocument.companyId,
      documentCode: `${previousDocument.documentCode}_V${previousDocument.versionNumber + 1}`,
      title: previousDocument.title,
      description: previousDocument.description,
      documentType: previousDocument.documentType,
      category: previousDocument.category,
      tags: previousDocument.tags,
      filename: path.basename(storagePath),
      originalFilename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileExtension: path.extname(file.originalname),
      storagePath,
      versionNumber: previousDocument.versionNumber + 1,
      previousVersionId: previousDocument.id,
      accessLevel: previousDocument.accessLevel,
      uploadedBy: req.user.id
    });

    await AuditLog.create({
      userId: req.user.id,
      companyId: previousDocument.companyId,
      actionType: 'CREATE',
      entityType: 'DOCUMENT_VERSION',
      entityId: newDocument.id,
      actionDescription: `Nouvelle version du document ${previousDocument.originalFilename}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: newDocument
    });

  } catch (error) {
    logger.error('Erreur création version:', error);
    next(error);
  }
};