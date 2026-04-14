const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const db = require('../models');
const logger = require('../utils/logger');
const { formatCurrency, formatDate } = require('../utils/helpers');

/**
 * Générer un PDF de facture
 */
const generateInvoicePDF = async (invoiceId) => {
  try {
    const invoice = await db.CustomerInvoice.findByPk(invoiceId, {
      include: [
        { model: db.Company, as: 'company' },
        { model: db.AuxiliaryAccount, as: 'customer' }
      ]
    });

    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    const outputPath = path.join(__dirname, '../../uploads/invoices', `${invoice.invoiceNumber}.pdf`);
    await fs.ensureDir(path.dirname(outputPath));

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`N° ${invoice.invoiceNumber}`, { align: 'right' });
    doc.moveDown();

    // Informations entreprise
    doc.fontSize(12).font('Helvetica-Bold').text(invoice.company.name);
    doc.fontSize(10).font('Helvetica')
       .text(invoice.company.address)
       .text(`Email: ${invoice.company.email}`)
       .text(`Tél: ${invoice.company.phoneNumber}`);
    doc.moveDown();

    // Informations client
    doc.fontSize(12).font('Helvetica-Bold').text('Facturé à:');
    doc.fontSize(10).font('Helvetica')
       .text(invoice.customer.accountName)
       .text(invoice.customer.address || '')
       .text(`Email: ${invoice.customer.email || ''}`);
    doc.moveDown();

    // Dates
    doc.fontSize(10)
       .text(`Date de facture: ${formatDate(invoice.invoiceDate)}`)
       .text(`Date d'échéance: ${formatDate(invoice.dueDate)}`);
    doc.moveDown();

    // Tableau des articles
    const tableTop = doc.y + 20;
    const tableHeaders = ['Description', 'Quantité', 'Prix unitaire', 'Total'];
    const columnWidths = [250, 80, 100, 100];
    let currentTop = tableTop;

    // En-têtes du tableau
    doc.font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentTop);
    });

    currentTop += 20;
    doc.font('Helvetica');

    // Lignes du tableau
    const items = invoice.items || [];
    items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      
      doc.text(item.description, 50, currentTop);
      doc.text(item.quantity.toString(), 300, currentTop);
      doc.text(formatCurrency(item.unitPrice), 380, currentTop);
      doc.text(formatCurrency(itemTotal), 480, currentTop);
      
      currentTop += 20;

      // Nouvelle page si nécessaire
      if (currentTop > 700) {
        doc.addPage();
        currentTop = 50;
      }
    });

    // Totaux
    currentTop += 20;
    doc.font('Helvetica-Bold')
       .text('Sous-total:', 380, currentTop)
       .text(formatCurrency(invoice.subtotal), 480, currentTop);
    
    currentTop += 20;
    doc.text('TVA:', 380, currentTop)
       .text(formatCurrency(invoice.taxAmount), 480, currentTop);
    
    currentTop += 20;
    doc.fontSize(12)
       .text('TOTAL:', 380, currentTop)
       .text(formatCurrency(invoice.totalAmount), 480, currentTop);

    // Conditions
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica')
       .text('Conditions de paiement:')
       .text(invoice.terms || 'Paiement à réception');

    // Pied de page
    doc.fontSize(8)
       .text('LogSys CRM - From G-tech', 50, 780, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        logger.info(`PDF généré: ${outputPath}`);
        resolve(outputPath);
      });
      stream.on('error', reject);
    });

  } catch (error) {
    logger.error('Erreur génération PDF facture:', error);
    throw error;
  }
};

/**
 * Générer un PDF de rapport comptable
 */
const generateReportPDF = async (type, data, options = {}) => {
  try {
    const outputPath = path.join(__dirname, '../../uploads/reports', `${type}_${Date.now()}.pdf`);
    await fs.ensureDir(path.dirname(outputPath));

    const doc = new PDFDocument({ size: 'A4', margin: 50, layout: options.landscape ? 'landscape' : 'portrait' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Titre
    doc.fontSize(18).font('Helvetica-Bold').text(getReportTitle(type), { align: 'center' });
    doc.moveDown();

    // Date du rapport
    doc.fontSize(10).font('Helvetica')
       .text(`Généré le ${formatDate(new Date())}`, { align: 'right' });
    doc.moveDown();

    // Contenu selon le type
    switch (type) {
      case 'balance-sheet':
        await generateBalanceSheetContent(doc, data);
        break;
      case 'income-statement':
        await generateIncomeStatementContent(doc, data);
        break;
      case 'trial-balance':
        await generateTrialBalanceContent(doc, data);
        break;
      case 'general-ledger':
        await generateGeneralLedgerContent(doc, data);
        break;
    }

    // Pied de page
    doc.fontSize(8)
       .text('LogSys CRM - From G-tech', 50, doc.page.height - 50, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });

  } catch (error) {
    logger.error('Erreur génération PDF rapport:', error);
    throw error;
  }
};

/**
 * Générer plusieurs types de documents
 */
const generatePDF = async (type, data) => {
  switch (type) {
    case 'invoice':
      return generateInvoicePDF(data.invoiceId);
    case 'report':
      return generateReportPDF(data.reportType, data.reportData, data.options);
    default:
      throw new Error(`Type de PDF non supporté: ${type}`);
  }
};

// Fonctions helper
const getReportTitle = (type) => {
  const titles = {
    'balance-sheet': 'BILAN',
    'income-statement': 'COMPTE DE RÉSULTAT',
    'trial-balance': 'BALANCE GÉNÉRALE',
    'general-ledger': 'GRAND LIVRE'
  };
  return titles[type] || type.toUpperCase();
};

const generateBalanceSheetContent = async (doc, data) => {
  doc.fontSize(14).font('Helvetica-Bold').text('ACTIF', { underline: true });
  doc.moveDown(0.5);
  
  let y = doc.y;
  data.assets?.forEach(asset => {
    doc.fontSize(10).font('Helvetica')
       .text(asset.accountName, 50, y)
       .text(formatCurrency(asset.balance), 400, y);
    y += 20;
  });

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('PASSIF', { underline: true });
  doc.moveDown(0.5);
  
  y = doc.y;
  data.liabilities?.forEach(liability => {
    doc.fontSize(10).font('Helvetica')
       .text(liability.accountName, 50, y)
       .text(formatCurrency(liability.balance), 400, y);
    y += 20;
  });
};

const generateIncomeStatementContent = async (doc, data) => {
  doc.fontSize(14).font('Helvetica-Bold').text('PRODUITS', { underline: true });
  doc.moveDown(0.5);
  
  let y = doc.y;
  data.revenue?.forEach(item => {
    doc.fontSize(10).font('Helvetica')
       .text(item.accountName, 50, y)
       .text(formatCurrency(item.amount), 400, y);
    y += 20;
  });

  doc.fontSize(12).font('Helvetica-Bold')
     .text('TOTAL PRODUITS', 300, y)
     .text(formatCurrency(data.totalRevenue), 400, y);
  
  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica-Bold').text('CHARGES', { underline: true });
  doc.moveDown(0.5);
  
  y = doc.y;
  data.expenses?.forEach(item => {
    doc.fontSize(10).font('Helvetica')
       .text(item.accountName, 50, y)
       .text(formatCurrency(item.amount), 400, y);
    y += 20;
  });

  doc.fontSize(12).font('Helvetica-Bold')
     .text('TOTAL CHARGES', 300, y)
     .text(formatCurrency(data.totalExpenses), 400, y);
  
  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold')
     .text('RÉSULTAT NET', 300, doc.y)
     .text(formatCurrency(data.netIncome), 400, doc.y);
};

const generateTrialBalanceContent = async (doc, data) => {
  const headers = ['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Débiteur', 'Solde Créditeur'];
  const colWidths = [70, 200, 80, 80, 80, 80];
  
  let y = doc.y;
  
  // En-têtes
  doc.font('Helvetica-Bold');
  headers.forEach((header, i) => {
    doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
  });
  
  y += 25;
  doc.font('Helvetica');
  
  data.balances?.forEach(row => {
    doc.text(row.accountNumber, 50, y);
    doc.text(row.accountName, 120, y);
    doc.text(formatCurrency(row.totalDebit), 320, y);
    doc.text(formatCurrency(row.totalCredit), 400, y);
    doc.text(formatCurrency(row.debitBalance), 480, y);
    doc.text(formatCurrency(row.creditBalance), 560, y);
    
    y += 20;
    
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });
};

const generateGeneralLedgerContent = async (doc, data) => {
  data.entries?.forEach(entry => {
    doc.fontSize(11).font('Helvetica-Bold')
       .text(`${entry.entryNumber} - ${formatDate(entry.entryDate)} - ${entry.description}`);
    doc.moveDown(0.5);
    
    let y = doc.y;
    
    entry.lines?.forEach(line => {
      doc.fontSize(10).font('Helvetica')
         .text(line.accountNumber, 50, y)
         .text(line.account?.accountName || '', 120, y)
         .text(formatCurrency(line.debitAmount), 400, y)
         .text(formatCurrency(line.creditAmount), 480, y);
      y += 18;
    });
    
    doc.moveDown();
  });
};

module.exports = {
  generatePDF,
  generateInvoicePDF,
  generateReportPDF
};