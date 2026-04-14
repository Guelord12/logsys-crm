const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { createWorker } = require('tesseract.js');

let worker = null;

const initWorker = async () => {
  if (!worker) {
    worker = await createWorker('fra+eng', 1, {
      logger: m => logger.debug(`OCR: ${m}`)
    });
    logger.info('✅ Worker OCR initialisé');
  }
  return worker;
};

const processOCR = async (documentId, filePath) => {
  try {
    const w = await initWorker();
    
    const { data } = await w.recognize(filePath);
    
    logger.info(`OCR terminé pour document ${documentId}: ${data.text.length} caractères`);
    
    return data.text;
    
  } catch (error) {
    logger.error(`Erreur OCR pour document ${documentId}:`, error);
    return null;
  }
};

const extractTextFromImage = async (imagePath) => {
  try {
    const w = await initWorker();
    const { data } = await w.recognize(imagePath);
    return data.text;
  } catch (error) {
    logger.error('Erreur extraction texte image:', error);
    return null;
  }
};

const extractTextFromPDF = async (pdfPath) => {
  const pdfParse = require('pdf-parse');
  
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    logger.error('Erreur extraction texte PDF:', error);
    return null;
  }
};

const cleanup = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
    logger.info('Worker OCR terminé');
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  processOCR,
  extractTextFromImage,
  extractTextFromPDF,
  cleanup
};