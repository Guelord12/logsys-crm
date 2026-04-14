const AWS = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../utils/logger');

let s3Client = null;

/**
 * Initialiser le client S3
 */
const initS3 = () => {
  if (config.storage.provider === 's3' && config.storage.s3.accessKeyId) {
    s3Client = new AWS.S3({
      region: config.storage.s3.region,
      accessKeyId: config.storage.s3.accessKeyId,
      secretAccessKey: config.storage.s3.secretAccessKey
    });
    logger.info('✅ Client S3 initialisé');
  }
};

/**
 * Upload un fichier vers le stockage
 */
const uploadToStorage = async (file, destinationPath) => {
  try {
    if (config.storage.provider === 's3' && s3Client) {
      return await uploadToS3(file, destinationPath);
    } else {
      return await uploadToLocal(file, destinationPath);
    }
  } catch (error) {
    logger.error('Erreur upload fichier:', error);
    throw error;
  }
};

/**
 * Upload vers S3
 */
const uploadToS3 = async (file, destinationPath) => {
  const fileContent = await fs.readFile(file.path);
  const key = path.join(destinationPath, `${Date.now()}_${file.originalname}`);
  
  const params = {
    Bucket: config.storage.s3.bucket,
    Key: key,
    Body: fileContent,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedBy: file.userId || 'system'
    }
  };

  const result = await s3Client.upload(params).promise();
  return result.Location;
};

/**
 * Upload local
 */
const uploadToLocal = async (file, destinationPath) => {
  const uploadDir = path.join(config.storage.local.uploadDir, destinationPath);
  await fs.ensureDir(uploadDir);
  
  const filename = `${Date.now()}_${file.originalname}`;
  const filepath = path.join(uploadDir, filename);
  
  await fs.move(file.path, filepath);
  
  return filepath;
};

/**
 * Supprimer un fichier du stockage
 */
const deleteFromStorage = async (filePath) => {
  try {
    if (config.storage.provider === 's3' && s3Client) {
      const key = filePath.replace(/.*\//, '');
      await s3Client.deleteObject({
        Bucket: config.storage.s3.bucket,
        Key: key
      }).promise();
    } else {
      await fs.remove(filePath);
    }
    
    logger.info(`Fichier supprimé: ${filePath}`);
    return true;
  } catch (error) {
    logger.error('Erreur suppression fichier:', error);
    throw error;
  }
};

/**
 * Obtenir une URL signée pour accès temporaire
 */
const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    if (config.storage.provider === 's3' && s3Client) {
      const key = filePath.replace(/.*\//, '');
      return s3Client.getSignedUrlPromise('getObject', {
        Bucket: config.storage.s3.bucket,
        Key: key,
        Expires: expiresIn
      });
    }
    
    return filePath;
  } catch (error) {
    logger.error('Erreur génération URL signée:', error);
    throw error;
  }
};

/**
 * Calculer le checksum d'un fichier
 */
const calculateChecksum = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

/**
 * Obtenir les informations d'un fichier
 */
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    logger.error('Erreur info fichier:', error);
    return null;
  }
};

// Initialiser S3 au démarrage
initS3();

module.exports = {
  uploadToStorage,
  deleteFromStorage,
  getSignedUrl,
  calculateChecksum,
  getFileInfo
};