const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');
const { generatePDF } = require('../services/pdf.service');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const {
  ChartOfAccountsOhada,
  AccountingPeriod,
  AccountingJournal,
  AccountingEntry,
  AccountingEntryLine,
  AuxiliaryAccount,
  CustomerInvoice,
  Payment,
  PaymentAllocation,
  Company,
  AuditLog,
  sequelize
} = db;

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
 * Helper pour formater les montants
 */
const formatMoney = (amount) => {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
};

/**
 * Helper pour exporter en CSV
 */
const exportAsCSV = (res, filename, csvRows) => {
  const csv = csvRows.map(row => row.join(';')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send('\uFEFF' + csv);
};

/**
 * Helper pour générer un PDF simple avec tableau
 */
const generateTablePDF = (res, filename, title, columns, rows, totals = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      doc.pipe(res);
      
      // Titre
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(2);
      
      // En-têtes du tableau
      const tableTop = doc.y;
      const colWidths = columns.map(c => c.width || 100);
      const rowHeight = 25;
      
      doc.fontSize(10).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        let x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(col.header, x, tableTop, { width: colWidths[i], align: col.align || 'left' });
      });
      
      doc.moveDown();
      
      // Lignes du tableau
      doc.font('Helvetica');
      let y = tableTop + rowHeight;
      
      rows.forEach(row => {
        // Vérifier si on a besoin d'une nouvelle page
        if (y > doc.page.height - 100) {
          doc.addPage({ margin: 50, size: 'A4', layout: 'landscape' });
          y = 50;
          
          // Réafficher les en-têtes
          doc.fontSize(10).font('Helvetica-Bold');
          columns.forEach((col, i) => {
            let x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(col.header, x, y, { width: colWidths[i], align: col.align || 'left' });
          });
          y += rowHeight;
          doc.font('Helvetica');
        }
        
        columns.forEach((col, i) => {
          let x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          const value = row[col.key] || '';
          doc.text(String(value), x, y, { width: colWidths[i], align: col.align || 'left' });
        });
        
        // Ligne de séparation
        doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, y + rowHeight - 5).lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y + rowHeight - 5).stroke();
        
        y += rowHeight;
      });
      
      // Totaux
      if (totals) {
        doc.moveDown();
        doc.font('Helvetica-Bold');
        totals.forEach((total, i) => {
          let x = 50 + colWidths.slice(0, total.colspan || 0).reduce((a, b) => a + b, 0);
          doc.text(total.label, x, y, { width: colWidths[total.colspan] || 200 });
          if (total.value !== undefined) {
            const valueX = 50 + colWidths.slice(0, total.valueCol || columns.length - 1).reduce((a, b) => a + b, 0);
            doc.text(String(total.value), valueX, y, { width: colWidths[total.valueCol || columns.length - 1], align: 'right' });
          }
        });
      }
      
      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Tableau de bord comptable
 */
exports.getDashboardData = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    const companyIdCondition = whereCompany.companyId ? 'AND entry.company_id = :companyId' : '';
    const replacements = whereCompany.companyId ? { companyId: whereCompany.companyId } : {};

    // Totaux - SQL brut pour éviter le problème de GROUP BY
    const totals = await sequelize.query(`
      SELECT 
        COALESCE(SUM(lines.debit_amount), 0) as "totalDebit",
        COALESCE(SUM(lines.credit_amount), 0) as "totalCredit"
      FROM accounting_entry_lines lines
      INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
      WHERE entry.status = 'POSTED'
      ${companyIdCondition}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Chiffre d'affaires (comptes de classe 7)
    const revenue = await sequelize.query(`
      SELECT 
        COALESCE(SUM(lines.credit_amount), 0) as "total"
      FROM accounting_entry_lines lines
      INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
      WHERE entry.status = 'POSTED'
        AND lines.account_number LIKE '7%'
        ${companyIdCondition}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Charges (comptes de classe 6)
    const expenses = await sequelize.query(`
      SELECT 
        COALESCE(SUM(lines.debit_amount), 0) as "total"
      FROM accounting_entry_lines lines
      INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
      WHERE entry.status = 'POSTED'
        AND lines.account_number LIKE '6%'
        ${companyIdCondition}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Trésorerie (comptes de classe 5)
    const cashBalance = await sequelize.query(`
      SELECT 
        COALESCE(SUM(COALESCE(lines.debit_amount, 0) - COALESCE(lines.credit_amount, 0)), 0) as "balance"
      FROM accounting_entry_lines lines
      INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
      WHERE entry.status = 'POSTED'
        AND (lines.account_number LIKE '5%' OR lines.account_number LIKE '57%')
        ${companyIdCondition}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Factures impayées
    const unpaidInvoices = await CustomerInvoice.findAll({
      where: {
        ...whereCompany,
        status: { [Op.in]: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] }
      },
      include: [{
        model: AuxiliaryAccount,
        as: 'customer',
        attributes: ['id', 'accountName', 'accountCode'],
        required: false
      }],
      order: [['dueDate', 'ASC']],
      limit: 10,
      paranoid: false
    });

    // Évolution mensuelle
    const monthlyData = await sequelize.query(`
      SELECT 
        DATE_TRUNC('month', entry.entry_date) as month,
        COALESCE(SUM(CASE WHEN lines.account_number LIKE '7%' THEN lines.credit_amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN lines.account_number LIKE '6%' THEN lines.debit_amount ELSE 0 END), 0) as expenses
      FROM accounting_entries entry
      LEFT JOIN accounting_entry_lines lines ON entry.id = lines.entry_id
      WHERE entry.status = 'POSTED'
        AND entry.entry_date >= CURRENT_DATE - INTERVAL '1 year'
        ${companyIdCondition}
      GROUP BY DATE_TRUNC('month', entry.entry_date)
      ORDER BY month ASC
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        totals: {
          totalAssets: parseFloat(totals[0]?.totalDebit || 0),
          totalLiabilities: parseFloat(totals[0]?.totalCredit || 0)
        },
        revenue: parseFloat(revenue[0]?.total || 0),
        expenses: parseFloat(expenses[0]?.total || 0),
        cashBalance: parseFloat(cashBalance[0]?.balance || 0),
        unpaidInvoices,
        revenueChart: monthlyData.map(d => ({
          month: d.month,
          revenue: parseFloat(d.revenue || 0),
          expenses: parseFloat(d.expenses || 0)
        })),
        expensesBreakdown: []
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard comptable:', error);
    next(error);
  }
};

/**
 * Récupérer le plan comptable OHADA
 */
exports.getChartOfAccounts = async (req, res, next) => {
  try {
    const { search, class: ohadaClass, isHeading } = req.query;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { accountNumber: { [Op.like]: `%${search}%` } },
        { accountName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (ohadaClass) {
      where.accountNumber = { [Op.like]: `${ohadaClass}%` };
    }

    if (isHeading !== undefined) {
      where.isHeading = isHeading === 'true';
    }

    const accounts = await ChartOfAccountsOhada.findAll({
      where,
      order: [['accountNumber', 'ASC']],
      paranoid: false
    });

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    logger.error('Erreur récupération plan comptable:', error);
    next(error);
  }
};

/**
 * Récupérer les périodes comptables
 */
exports.getPeriods = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const periods = await AccountingPeriod.findAll({
      where: whereCompany,
      order: [['startDate', 'DESC']],
      paranoid: false
    });

    res.json({
      success: true,
      data: periods
    });

  } catch (error) {
    logger.error('Erreur récupération périodes:', error);
    next(error);
  }
};

/**
 * Créer une période comptable
 */
exports.createPeriod = async (req, res, next) => {
  try {
    const { periodCode, periodName, startDate, endDate } = req.body;
    const whereCompany = getCompanyWhere(req.user);

    const existing = await AccountingPeriod.findOne({
      where: {
        ...whereCompany,
        [Op.or]: [
          { periodCode },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: endDate } },
              { endDate: { [Op.gte]: startDate } }
            ]
          }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Une période avec ce code ou chevauchant ces dates existe déjà'
      });
    }

    const period = await AccountingPeriod.create({
      ...whereCompany,
      periodCode,
      periodName,
      startDate,
      endDate
    });

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'ACCOUNTING_PERIOD',
      entityId: period.id,
      actionDescription: `Création période comptable ${periodCode}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: period
    });

  } catch (error) {
    logger.error('Erreur création période:', error);
    next(error);
  }
};

/**
 * Récupérer les journaux comptables
 */
exports.getJournals = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const journals = await AccountingJournal.findAll({
      where: whereCompany,
      order: [['journalCode', 'ASC']],
      paranoid: false
    });

    res.json({
      success: true,
      data: journals
    });

  } catch (error) {
    logger.error('Erreur récupération journaux:', error);
    next(error);
  }
};

/**
 * Récupérer les écritures comptables
 */
exports.getEntries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      periodId,
      journalId,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    if (periodId) where.periodId = periodId;
    if (journalId) where.journalId = journalId;
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.entryDate = { [Op.between]: [startDate, endDate] };
    }

    if (search) {
      where[Op.or] = [
        { entryNumber: { [Op.like]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { referenceNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: entries } = await AccountingEntry.findAndCountAll({
      where,
      include: [
        {
          model: AccountingPeriod,
          as: 'period',
          required: false
        },
        {
          model: AccountingJournal,
          as: 'journal',
          required: false
        },
        {
          model: AccountingEntryLine,
          as: 'lines',
          include: [{
            model: ChartOfAccountsOhada,
            as: 'account',
            foreignKey: 'accountNumber',
            required: false
          }],
          paranoid: false,
          required: false
        }
      ],
      order: [['entryDate', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      paranoid: false
    });

    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération écritures:', error);
    next(error);
  }
};

/**
 * Récupérer une écriture comptable
 */
exports.getEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const entry = await AccountingEntry.findOne({
      where: {
        id,
        ...whereCompany
      },
      include: [
        {
          model: AccountingPeriod,
          as: 'period',
          required: false
        },
        {
          model: AccountingJournal,
          as: 'journal',
          required: false
        },
        {
          model: AccountingEntryLine,
          as: 'lines',
          include: [
            {
              model: ChartOfAccountsOhada,
              as: 'account',
              foreignKey: 'accountNumber',
              required: false
            },
            {
              model: AuxiliaryAccount,
              as: 'auxiliaryAccount',
              required: false
            }
          ],
          paranoid: false,
          required: false
        }
      ],
      paranoid: false
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Écriture non trouvée'
      });
    }

    res.json({
      success: true,
      data: entry
    });

  } catch (error) {
    logger.error('Erreur récupération écriture:', error);
    next(error);
  }
};

/**
 * Créer une écriture comptable
 */
exports.createEntry = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      periodId,
      journalId,
      entryDate,
      documentDate,
      referenceNumber,
      documentType,
      description,
      lines
    } = req.body;

    // Vérifier la période
    const period = await AccountingPeriod.findByPk(periodId);
    if (!period || period.isClosed) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Période invalide ou clôturée'
      });
    }

    // Vérifier l'équilibre
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debitAmount) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.creditAmount) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'L\'écriture n\'est pas équilibrée'
      });
    }

    // Générer le numéro d'écriture
    const whereCompany = getCompanyWhere(req.user);
    const lastEntry = await AccountingEntry.findOne({
      where: { ...whereCompany, journalId },
      order: [['created_at', 'DESC']],
      transaction
    });

    let sequenceNumber = 1;
    if (lastEntry?.entryNumber) {
      const match = lastEntry.entryNumber.match(/(\d+)$/);
      if (match) sequenceNumber = parseInt(match[1]) + 1;
    }

    const journal = await AccountingJournal.findByPk(journalId);
    const entryNumber = `${journal.journalCode}${new Date().getFullYear()}${String(sequenceNumber).padStart(5, '0')}`;

    // Créer l'écriture
    const entry = await AccountingEntry.create({
      ...whereCompany,
      entryNumber,
      periodId,
      journalId,
      entryDate,
      documentDate: documentDate || entryDate,
      referenceNumber,
      documentType,
      description,
      status: 'DRAFT',
      createdBy: req.user.id
    }, { transaction });

    // Créer les lignes
    await AccountingEntryLine.bulkCreate(
      lines.map((line, index) => ({
        entryId: entry.id,
        lineNumber: index + 1,
        accountNumber: line.accountNumber,
        auxiliaryAccountId: line.auxiliaryAccountId,
        description: line.description,
        debitAmount: line.debitAmount || 0,
        creditAmount: line.creditAmount || 0,
        currency: line.currency || 'USD',
        exchangeRate: line.exchangeRate || 1,
        transactionRefType: line.transactionRefType,
        transactionRefId: line.transactionRefId
      })),
      { transaction }
    );

    await transaction.commit();

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'ACCOUNTING_ENTRY',
      entityId: entry.id,
      actionDescription: `Création écriture ${entryNumber}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: entry
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur création écriture:', error);
    next(error);
  }
};

/**
 * Comptabiliser une écriture
 */
exports.postEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const whereCompany = getCompanyWhere(req.user);

    const entry = await AccountingEntry.findOne({
      where: {
        id,
        ...whereCompany,
        status: 'DRAFT'
      },
      include: ['period']
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Écriture non trouvée ou déjà comptabilisée'
      });
    }

    if (entry.period.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'La période est clôturée'
      });
    }

    await entry.update({
      status: 'POSTED',
      postedBy: req.user.id,
      postedAt: new Date()
    });

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'UPDATE',
      entityType: 'ACCOUNTING_ENTRY',
      entityId: entry.id,
      actionDescription: `Comptabilisation écriture ${entry.entryNumber}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Écriture comptabilisée avec succès'
    });

  } catch (error) {
    logger.error('Erreur comptabilisation écriture:', error);
    next(error);
  }
};

/**
 * Récupérer les factures
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      startDate,
      endDate
    } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate && endDate) {
      where.invoiceDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: invoices } = await CustomerInvoice.findAndCountAll({
      where,
      include: [{
        model: AuxiliaryAccount,
        as: 'customer',
        required: false
      }],
      order: [['invoiceDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      paranoid: false
    });

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération factures:', error);
    next(error);
  }
};

/**
 * Créer une facture
 */
exports.createInvoice = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      customerId,
      invoiceDate,
      dueDate,
      items,
      notes,
      terms
    } = req.body;

    // Calculer les totaux
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      taxAmount += itemTotal * (item.taxRate / 100);
    });

    const totalAmount = subtotal + taxAmount;

    // Générer le numéro de facture
    const whereCompany = getCompanyWhere(req.user);
    const lastInvoice = await CustomerInvoice.findOne({
      where: whereCompany,
      order: [['created_at', 'DESC']],
      transaction
    });

    let sequenceNumber = 1;
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) sequenceNumber = parseInt(match[1]) + 1;
    }

    const invoiceNumber = `FAC${new Date().getFullYear()}${String(sequenceNumber).padStart(6, '0')}`;

    const invoice = await CustomerInvoice.create({
      ...whereCompany,
      invoiceNumber,
      customerId,
      invoiceDate,
      dueDate,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount,
      currency: 'USD',
      status: 'DRAFT',
      notes,
      terms,
      createdBy: req.user.id
    }, { transaction });

    await transaction.commit();

    // Générer le PDF
    await generatePDF('invoice', { invoiceId: invoice.id }).catch(err => 
      logger.warn('Erreur génération PDF facture:', err)
    );

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoice.id,
      actionDescription: `Création facture ${invoiceNumber}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: invoice
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur création facture:', error);
    next(error);
  }
};

/**
 * Récupérer les factures impayées
 */
exports.getUnpaidInvoices = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const invoices = await CustomerInvoice.findAll({
      where: {
        ...whereCompany,
        status: { [Op.in]: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] }
      },
      include: [{
        model: AuxiliaryAccount,
        as: 'customer',
        attributes: ['id', 'accountName', 'accountCode'],
        required: false
      }],
      order: [['dueDate', 'ASC']],
      paranoid: false
    });

    res.json({
      success: true,
      data: invoices
    });

  } catch (error) {
    logger.error('Erreur récupération factures impayées:', error);
    next(error);
  }
};

/**
 * Récupérer les écritures récentes
 */
exports.getRecentEntries = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const whereCompany = getCompanyWhere(req.user);

    const entries = await AccountingEntry.findAll({
      where: {
        ...whereCompany,
        status: 'POSTED'
      },
      include: [
        {
          model: AccountingJournal,
          as: 'journal',
          attributes: ['journalCode', 'journalName'],
          required: false
        },
        {
          model: AccountingEntryLine,
          as: 'lines',
          attributes: ['debitAmount', 'creditAmount'],
          paranoid: false,
          required: false
        }
      ],
      order: [['entryDate', 'DESC']],
      limit: parseInt(limit),
      paranoid: false
    });

    res.json({
      success: true,
      data: entries
    });

  } catch (error) {
    logger.error('Erreur récupération écritures récentes:', error);
    next(error);
  }
};

/**
 * Générer un rapport comptable
 */
exports.generateReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    let { startDate, endDate, periodId, period } = req.query;
    const whereCompany = getCompanyWhere(req.user);

    // Gérer les périodes prédéfinies
    if (period === 'current-month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'current-quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    } else if (period === 'current-year') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    let reportData;

    switch (type) {
      case 'balance-sheet':
        if (!periodId) {
          const currentPeriod = await AccountingPeriod.findOne({
            where: {
              ...whereCompany,
              startDate: { [Op.lte]: new Date() },
              endDate: { [Op.gte]: new Date() }
            },
            paranoid: false
          });
          
          if (!currentPeriod) {
            const now = new Date();
            const year = now.getFullYear();
            const defaultPeriod = await AccountingPeriod.create({
              ...whereCompany,
              periodCode: `${year}-01`,
              periodName: `Exercice ${year}`,
              startDate: `${year}-01-01`,
              endDate: `${year}-12-31`
            });
            periodId = defaultPeriod.id;
          } else {
            periodId = currentPeriod.id;
          }
        }
        reportData = await generateBalanceSheet(whereCompany, periodId);
        break;
        
      case 'income-statement':
        if (!startDate || !endDate) {
          const now = new Date();
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        reportData = await generateIncomeStatement(whereCompany, startDate, endDate);
        break;
        
      case 'trial-balance':
        if (!periodId) {
          const currentPeriod = await AccountingPeriod.findOne({
            where: {
              ...whereCompany,
              startDate: { [Op.lte]: new Date() },
              endDate: { [Op.gte]: new Date() }
            },
            paranoid: false
          });
          
          if (!currentPeriod) {
            const now = new Date();
            const year = now.getFullYear();
            const defaultPeriod = await AccountingPeriod.create({
              ...whereCompany,
              periodCode: `${year}-01`,
              periodName: `Exercice ${year}`,
              startDate: `${year}-01-01`,
              endDate: `${year}-12-31`
            });
            periodId = defaultPeriod.id;
          } else {
            periodId = currentPeriod.id;
          }
        }
        reportData = await generateTrialBalance(whereCompany, periodId);
        break;
        
      case 'general-ledger':
        if (!startDate || !endDate) {
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        reportData = await generateGeneralLedger(whereCompany, startDate, endDate);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de rapport invalide'
        });
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error('Erreur génération rapport:', error);
    next(error);
  }
};

/**
 * Récupérer les paiements
 */
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const whereCompany = getCompanyWhere(req.user);

    const where = { ...whereCompany };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.paymentDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: AuxiliaryAccount, as: 'payer', required: false },
        { model: AuxiliaryAccount, as: 'payee', required: false }
      ],
      order: [['paymentDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      paranoid: false
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération paiements:', error);
    next(error);
  }
};

/**
 * Créer un paiement
 */
exports.createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      paymentType,
      paymentMethod,
      payerId,
      payeeId,
      paymentDate,
      amount,
      currency,
      reference,
      notes,
      allocations
    } = req.body;

    const whereCompany = getCompanyWhere(req.user);

    // Générer le numéro de paiement
    const lastPayment = await Payment.findOne({
      where: whereCompany,
      order: [['created_at', 'DESC']],
      transaction
    });

    let sequenceNumber = 1;
    if (lastPayment?.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/(\d+)$/);
      if (match) sequenceNumber = parseInt(match[1]) + 1;
    }

    const paymentNumber = `PAY${new Date().getFullYear()}${String(sequenceNumber).padStart(6, '0')}`;

    const payment = await Payment.create({
      ...whereCompany,
      paymentNumber,
      paymentType,
      paymentMethod,
      payerId,
      payeeId,
      paymentDate,
      amount,
      currency: currency || 'USD',
      transactionReference: reference,
      notes,
      status: 'PENDING',
      createdBy: req.user.id
    }, { transaction });

    // Créer les allocations si fournies
    if (allocations && allocations.length > 0) {
      await PaymentAllocation.bulkCreate(
        allocations.map(allocation => ({
          paymentId: payment.id,
          invoiceId: allocation.invoiceId,
          allocatedAmount: allocation.amount,
          discountTaken: allocation.discount || 0,
          createdBy: req.user.id
        })),
        { transaction }
      );
    }

    await transaction.commit();

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      actionDescription: `Création paiement ${paymentNumber}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: payment
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur création paiement:', error);
    next(error);
  }
};

// =====================================================
// FONCTIONS HELPER POUR LES RAPPORTS
// =====================================================

async function generateBalanceSheet(whereCompany, periodId) {
  const period = await AccountingPeriod.findByPk(periodId);
  if (!period) {
    throw new Error('Période non trouvée');
  }
  
  const companyIdCondition = whereCompany.companyId ? 'AND entry.company_id = :companyId' : '';
  const replacements = whereCompany.companyId ? { companyId: whereCompany.companyId } : {};

  const assets = await sequelize.query(`
    SELECT 
      lines.account_number as "accountNumber",
      COALESCE(SUM(COALESCE(lines.debit_amount, 0) - COALESCE(lines.credit_amount, 0)), 0) as balance
    FROM accounting_entry_lines lines
    INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
    WHERE entry.status = 'POSTED'
      AND entry.entry_date <= :endDate
      AND (lines.account_number LIKE '1%' 
        OR lines.account_number LIKE '2%' 
        OR lines.account_number LIKE '3%' 
        OR lines.account_number LIKE '4%' 
        OR lines.account_number LIKE '5%')
      ${companyIdCondition}
    GROUP BY lines.account_number
    ORDER BY lines.account_number ASC
  `, {
    replacements: { ...replacements, endDate: period.endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const liabilities = await sequelize.query(`
    SELECT 
      lines.account_number as "accountNumber",
      COALESCE(SUM(COALESCE(lines.credit_amount, 0) - COALESCE(lines.debit_amount, 0)), 0) as balance
    FROM accounting_entry_lines lines
    INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
    WHERE entry.status = 'POSTED'
      AND entry.entry_date <= :endDate
      AND (lines.account_number LIKE '1%' OR lines.account_number LIKE '4%')
      ${companyIdCondition}
    GROUP BY lines.account_number
    ORDER BY lines.account_number ASC
  `, {
    replacements: { ...replacements, endDate: period.endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + parseFloat(l.balance || 0), 0);

  return { 
    assets, 
    liabilities, 
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    period 
  };
}

async function generateIncomeStatement(whereCompany, startDate, endDate) {
  const companyIdCondition = whereCompany.companyId ? 'AND entry.company_id = :companyId' : '';
  const replacements = whereCompany.companyId ? { companyId: whereCompany.companyId } : {};

  const revenue = await sequelize.query(`
    SELECT 
      lines.account_number as "accountNumber",
      COALESCE(SUM(lines.credit_amount), 0) as amount
    FROM accounting_entry_lines lines
    INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
    WHERE entry.status = 'POSTED'
      AND entry.entry_date BETWEEN :startDate AND :endDate
      AND lines.account_number LIKE '7%'
      ${companyIdCondition}
    GROUP BY lines.account_number
    ORDER BY lines.account_number ASC
  `, {
    replacements: { ...replacements, startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const expenses = await sequelize.query(`
    SELECT 
      lines.account_number as "accountNumber",
      COALESCE(SUM(lines.debit_amount), 0) as amount
    FROM accounting_entry_lines lines
    INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
    WHERE entry.status = 'POSTED'
      AND entry.entry_date BETWEEN :startDate AND :endDate
      AND lines.account_number LIKE '6%'
      ${companyIdCondition}
    GROUP BY lines.account_number
    ORDER BY lines.account_number ASC
  `, {
    replacements: { ...replacements, startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    period: { startDate, endDate }
  };
}

async function generateTrialBalance(whereCompany, periodId) {
  const period = await AccountingPeriod.findByPk(periodId);
  if (!period) {
    throw new Error('Période non trouvée');
  }
  
  const companyIdCondition = whereCompany.companyId ? 'AND entry.company_id = :companyId' : '';
  const replacements = whereCompany.companyId ? { companyId: whereCompany.companyId } : {};

  const balances = await sequelize.query(`
    SELECT 
      lines.account_number as "accountNumber",
      coa.account_name as "accountName",
      COALESCE(SUM(lines.debit_amount), 0) as "totalDebit",
      COALESCE(SUM(lines.credit_amount), 0) as "totalCredit",
      COALESCE(SUM(COALESCE(lines.debit_amount, 0) - COALESCE(lines.credit_amount, 0)), 0) as "debitBalance",
      COALESCE(SUM(COALESCE(lines.credit_amount, 0) - COALESCE(lines.debit_amount, 0)), 0) as "creditBalance"
    FROM accounting_entry_lines lines
    INNER JOIN accounting_entries entry ON lines.entry_id = entry.id
    LEFT JOIN chart_of_accounts_ohada coa ON lines.account_number = coa.account_number
    WHERE entry.status = 'POSTED'
      AND entry.entry_date <= :endDate
      ${companyIdCondition}
    GROUP BY lines.account_number, coa.account_name
    ORDER BY lines.account_number ASC
  `, {
    replacements: { ...replacements, endDate: period.endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const totalDebit = balances.reduce((sum, b) => sum + parseFloat(b.totalDebit || 0), 0);
  const totalCredit = balances.reduce((sum, b) => sum + parseFloat(b.totalCredit || 0), 0);

  return { 
    balances, 
    totalDebit, 
    totalCredit, 
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    period 
  };
}

async function generateGeneralLedger(whereCompany, startDate, endDate) {
  const companyIdCondition = whereCompany.companyId ? 'AND entry.company_id = :companyId' : '';
  const replacements = whereCompany.companyId ? { companyId: whereCompany.companyId } : {};

  const entries = await sequelize.query(`
    SELECT 
      entry.id,
      entry.entry_number as "entryNumber",
      entry.entry_date as "entryDate",
      entry.description,
      entry.status,
      journal.journal_code as "journalCode",
      journal.journal_name as "journalName",
      lines.line_number as "lineNumber",
      lines.account_number as "accountNumber",
      coa.account_name as "accountName",
      lines.description as "lineDescription",
      lines.debit_amount as "debitAmount",
      lines.credit_amount as "creditAmount",
      aux.account_name as "auxiliaryAccountName"
    FROM accounting_entries entry
    LEFT JOIN accounting_journals journal ON entry.journal_id = journal.id
    LEFT JOIN accounting_entry_lines lines ON entry.id = lines.entry_id
    LEFT JOIN chart_of_accounts_ohada coa ON lines.account_number = coa.account_number
    LEFT JOIN auxiliary_accounts aux ON lines.auxiliary_account_id = aux.id
    WHERE entry.status = 'POSTED'
      AND entry.entry_date BETWEEN :startDate AND :endDate
      ${companyIdCondition}
    ORDER BY entry.entry_date ASC, entry.entry_number ASC, lines.line_number ASC
  `, {
    replacements: { ...replacements, startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const groupedEntries = [];
  const entryMap = new Map();

  entries.forEach(row => {
    if (!entryMap.has(row.id)) {
      entryMap.set(row.id, {
        id: row.id,
        entryNumber: row.entryNumber,
        entryDate: row.entryDate,
        description: row.description,
        status: row.status,
        journal: {
          journalCode: row.journalCode,
          journalName: row.journalName
        },
        lines: []
      });
      groupedEntries.push(entryMap.get(row.id));
    }
    
    if (row.lineNumber) {
      entryMap.get(row.id).lines.push({
        lineNumber: row.lineNumber,
        accountNumber: row.accountNumber,
        accountName: row.accountName,
        description: row.lineDescription,
        debitAmount: parseFloat(row.debitAmount || 0),
        creditAmount: parseFloat(row.creditAmount || 0),
        auxiliaryAccountName: row.auxiliaryAccountName
      });
    }
  });

  groupedEntries.forEach(entry => {
    entry.totalDebit = entry.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    entry.totalCredit = entry.lines.reduce((sum, line) => sum + line.creditAmount, 0);
  });

  return { entries: groupedEntries, period: { startDate, endDate } };
}

// =====================================================
// FONCTIONS D'EXPORT (PDF ou CSV)
// =====================================================

/**
 * Exporter le bilan (PDF ou CSV)
 */
exports.exportBalanceSheet = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    let { periodId, format = 'pdf' } = req.query;
    
    if (!periodId) {
      const currentPeriod = await AccountingPeriod.findOne({
        where: {
          ...whereCompany,
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() }
        },
        paranoid: false
      });
      periodId = currentPeriod?.id;
    }
    
    if (!periodId) {
      return res.status(400).json({ success: false, message: 'Période non trouvée' });
    }
    
    const reportData = await generateBalanceSheet(whereCompany, periodId);
    
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push(['BILAN', '', '']);
      csvRows.push(['Période', reportData.period.periodName, '']);
      csvRows.push(['', '', '']);
      csvRows.push(['ACTIF', '', 'Montant']);
      reportData.assets.forEach(a => csvRows.push([a.accountNumber, '', a.balance]));
      csvRows.push(['TOTAL ACTIF', '', reportData.totalAssets.toFixed(2)]);
      csvRows.push(['', '', '']);
      csvRows.push(['PASSIF', '', 'Montant']);
      reportData.liabilities.forEach(l => csvRows.push([l.accountNumber, '', l.balance]));
      csvRows.push(['TOTAL PASSIF', '', reportData.totalLiabilities.toFixed(2)]);
      csvRows.push(['', '', '']);
      csvRows.push(['SITUATION NETTE', '', reportData.netWorth.toFixed(2)]);
      
      return exportAsCSV(res, `bilan_${reportData.period.periodCode}`, csvRows);
    }
    
    // Format PDF
    const columns = [
      { header: 'N° Compte', key: 'accountNumber', width: 120 },
      { header: 'Montant', key: 'balance', width: 150, align: 'right' }
    ];
    
    const assetRows = reportData.assets.map(a => ({ accountNumber: a.accountNumber, balance: formatMoney(a.balance) }));
    const liabilityRows = reportData.liabilities.map(l => ({ accountNumber: l.accountNumber, balance: formatMoney(l.balance) }));
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `bilan_${reportData.period.periodCode}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    // Titre
    doc.fontSize(20).font('Helvetica-Bold').text('BILAN', { align: 'center' });
    doc.fontSize(12).text(`Période : ${reportData.period.periodName}`, { align: 'center' });
    doc.moveDown(2);
    
    // Actif
    doc.fontSize(14).font('Helvetica-Bold').text('ACTIF', { underline: true });
    doc.moveDown(0.5);
    
    let y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('N° Compte', 50, y);
    doc.text('Montant', 300, y, { width: 150, align: 'right' });
    doc.moveDown();
    
    doc.font('Helvetica');
    assetRows.forEach(row => {
      y = doc.y;
      doc.text(row.accountNumber, 50, y);
      doc.text(row.balance, 300, y, { width: 150, align: 'right' });
      doc.moveDown();
    });
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL ACTIF', 50, doc.y);
    doc.text(formatMoney(reportData.totalAssets), 300, doc.y - 15, { width: 150, align: 'right' });
    doc.moveDown(2);
    
    // Passif
    doc.fontSize(14).font('Helvetica-Bold').text('PASSIF', { underline: true });
    doc.moveDown(0.5);
    
    y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('N° Compte', 50, y);
    doc.text('Montant', 300, y, { width: 150, align: 'right' });
    doc.moveDown();
    
    doc.font('Helvetica');
    liabilityRows.forEach(row => {
      y = doc.y;
      doc.text(row.accountNumber, 50, y);
      doc.text(row.balance, 300, y, { width: 150, align: 'right' });
      doc.moveDown();
    });
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL PASSIF', 50, doc.y);
    doc.text(formatMoney(reportData.totalLiabilities), 300, doc.y - 15, { width: 150, align: 'right' });
    doc.moveDown(2);
    
    doc.fontSize(12).text(`SITUATION NETTE : ${formatMoney(reportData.netWorth)}`, 50, doc.y);
    
    doc.end();
  } catch (error) {
    logger.error('Erreur export bilan:', error);
    next(error);
  }
};

/**
 * Exporter le compte de résultat (PDF ou CSV)
 */
exports.exportIncomeStatement = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    let { startDate, endDate, format = 'pdf' } = req.query;
    
    if (!startDate || !endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    
    const reportData = await generateIncomeStatement(whereCompany, startDate, endDate);
    
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push(['COMPTE DE RÉSULTAT', '', '']);
      csvRows.push(['Période', `${startDate} au ${endDate}`, '']);
      csvRows.push(['', '', '']);
      csvRows.push(['PRODUITS', '', 'Montant']);
      reportData.revenue.forEach(r => csvRows.push([r.accountNumber, '', r.amount]));
      csvRows.push(['TOTAL PRODUITS', '', reportData.totalRevenue.toFixed(2)]);
      csvRows.push(['', '', '']);
      csvRows.push(['CHARGES', '', 'Montant']);
      reportData.expenses.forEach(e => csvRows.push([e.accountNumber, '', e.amount]));
      csvRows.push(['TOTAL CHARGES', '', reportData.totalExpenses.toFixed(2)]);
      csvRows.push(['', '', '']);
      csvRows.push(['RÉSULTAT NET', '', reportData.netIncome.toFixed(2)]);
      
      return exportAsCSV(res, `compte_resultat_${startDate}_${endDate}`, csvRows);
    }
    
    // Format PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `compte_resultat_${startDate}_${endDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    doc.fontSize(20).font('Helvetica-Bold').text('COMPTE DE RÉSULTAT', { align: 'center' });
    doc.fontSize(12).text(`Période du ${startDate} au ${endDate}`, { align: 'center' });
    doc.moveDown(2);
    
    // Produits
    doc.fontSize(14).font('Helvetica-Bold').text('PRODUITS', { underline: true });
    doc.moveDown(0.5);
    
    let y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('N° Compte', 50, y);
    doc.text('Montant', 300, y, { width: 150, align: 'right' });
    doc.moveDown();
    
    doc.font('Helvetica');
    reportData.revenue.forEach(r => {
      y = doc.y;
      doc.text(r.accountNumber, 50, y);
      doc.text(formatMoney(r.amount), 300, y, { width: 150, align: 'right' });
      doc.moveDown();
    });
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL PRODUITS', 50, doc.y);
    doc.text(formatMoney(reportData.totalRevenue), 300, doc.y - 15, { width: 150, align: 'right' });
    doc.moveDown(2);
    
    // Charges
    doc.fontSize(14).font('Helvetica-Bold').text('CHARGES', { underline: true });
    doc.moveDown(0.5);
    
    y = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('N° Compte', 50, y);
    doc.text('Montant', 300, y, { width: 150, align: 'right' });
    doc.moveDown();
    
    doc.font('Helvetica');
    reportData.expenses.forEach(e => {
      y = doc.y;
      doc.text(e.accountNumber, 50, y);
      doc.text(formatMoney(e.amount), 300, y, { width: 150, align: 'right' });
      doc.moveDown();
    });
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL CHARGES', 50, doc.y);
    doc.text(formatMoney(reportData.totalExpenses), 300, doc.y - 15, { width: 150, align: 'right' });
    doc.moveDown(2);
    
    // Résultat
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`RÉSULTAT NET : ${formatMoney(reportData.netIncome)}`, 50, doc.y);
    
    doc.end();
  } catch (error) {
    logger.error('Erreur export compte de résultat:', error);
    next(error);
  }
};

/**
 * Exporter la balance générale (PDF ou CSV)
 */
exports.exportTrialBalance = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    let { periodId, format = 'pdf' } = req.query;
    
    if (!periodId) {
      const currentPeriod = await AccountingPeriod.findOne({
        where: {
          ...whereCompany,
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() }
        },
        paranoid: false
      });
      periodId = currentPeriod?.id;
    }
    
    if (!periodId) {
      return res.status(400).json({ success: false, message: 'Période non trouvée' });
    }
    
    const reportData = await generateTrialBalance(whereCompany, periodId);
    
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push(['BALANCE GÉNÉRALE', '', '', '', '', '']);
      csvRows.push(['Période', reportData.period.periodName, '', '', '', '']);
      csvRows.push(['', '', '', '', '', '']);
      csvRows.push(['N° Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Débiteur', 'Solde Créditeur']);
      reportData.balances.forEach(b => {
        csvRows.push([b.accountNumber, b.accountName || '', b.totalDebit, b.totalCredit, b.debitBalance, b.creditBalance]);
      });
      csvRows.push(['TOTAL', '', reportData.totalDebit, reportData.totalCredit, '', '']);
      
      return exportAsCSV(res, `balance_${reportData.period.periodCode}`, csvRows);
    }
    
    // Format PDF - Utiliser le helper generateTablePDF
    const columns = [
      { header: 'N° Compte', key: 'accountNumber', width: 100 },
      { header: 'Libellé', key: 'accountName', width: 200 },
      { header: 'Débit', key: 'totalDebit', width: 100, align: 'right' },
      { header: 'Crédit', key: 'totalCredit', width: 100, align: 'right' },
      { header: 'Solde Déb.', key: 'debitBalance', width: 100, align: 'right' },
      { header: 'Solde Créd.', key: 'creditBalance', width: 100, align: 'right' }
    ];
    
    const rows = reportData.balances.map(b => ({
      accountNumber: b.accountNumber,
      accountName: b.accountName || '',
      totalDebit: formatMoney(b.totalDebit),
      totalCredit: formatMoney(b.totalCredit),
      debitBalance: formatMoney(b.debitBalance),
      creditBalance: formatMoney(b.creditBalance)
    }));
    
    await generateTablePDF(
      res, 
      `balance_${reportData.period.periodCode}.pdf`,
      `BALANCE GÉNÉRALE - ${reportData.period.periodName}`,
      columns,
      rows,
      [{ label: 'TOTAL', colspan: 2, value: `${formatMoney(reportData.totalDebit)} / ${formatMoney(reportData.totalCredit)}`, valueCol: 2 }]
    );
  } catch (error) {
    logger.error('Erreur export balance:', error);
    next(error);
  }
};

/**
 * Exporter le grand livre (PDF ou CSV)
 */
exports.exportGeneralLedger = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    let { startDate, endDate, format = 'pdf' } = req.query;
    
    if (!startDate || !endDate) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
    
    const reportData = await generateGeneralLedger(whereCompany, startDate, endDate);
    
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push(['GRAND LIVRE', '', '', '', '', '', '']);
      csvRows.push(['Période', `${startDate} au ${endDate}`, '', '', '', '', '']);
      csvRows.push(['', '', '', '', '', '', '']);
      csvRows.push(['Date', 'N° Écriture', 'Journal', 'N° Compte', 'Libellé', 'Débit', 'Crédit']);
      reportData.entries.forEach(entry => {
        entry.lines.forEach(line => {
          csvRows.push([
            entry.entryDate,
            entry.entryNumber,
            entry.journal?.journalCode || '',
            line.accountNumber,
            line.description || entry.description,
            line.debitAmount,
            line.creditAmount
          ]);
        });
      });
      
      return exportAsCSV(res, `grand_livre_${startDate}_${endDate}`, csvRows);
    }
    
    // Format PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    const filename = `grand_livre_${startDate}_${endDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    doc.fontSize(16).font('Helvetica-Bold').text('GRAND LIVRE', { align: 'center' });
    doc.fontSize(10).text(`Période du ${startDate} au ${endDate}`, { align: 'center' });
    doc.moveDown();
    
    reportData.entries.forEach(entry => {
      doc.fontSize(11).font('Helvetica-Bold').text(`${entry.entryDate} - ${entry.entryNumber} - ${entry.journal?.journalName || ''} - ${entry.description}`);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      
      entry.lines.forEach(line => {
        doc.text(`  ${line.accountNumber} - ${line.accountName || ''} : ${line.description || ''} | Débit: ${formatMoney(line.debitAmount)} | Crédit: ${formatMoney(line.creditAmount)}`);
      });
      
      doc.font('Helvetica-Bold');
      doc.text(`  Total: Débit ${formatMoney(entry.totalDebit)} | Crédit ${formatMoney(entry.totalCredit)}`);
      doc.moveDown();
      doc.font('Helvetica');
    });
    
    doc.end();
  } catch (error) {
    logger.error('Erreur export grand livre:', error);
    next(error);
  }
};

/**
 * Exporter la balance âgée (PDF ou CSV)
 */
exports.exportAgedBalance = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);
    const { format = 'pdf' } = req.query;
    
    const invoices = await CustomerInvoice.findAll({
      where: {
        ...whereCompany,
        status: { [Op.in]: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] }
      },
      include: [{
        model: AuxiliaryAccount,
        as: 'customer',
        attributes: ['accountName', 'accountCode']
      }],
      order: [['dueDate', 'ASC']],
      paranoid: false
    });
    
    const now = new Date();
    
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push(['BALANCE ÂGÉE CLIENTS', '', '', '', '', '']);
      csvRows.push(['Date', new Date().toLocaleDateString('fr-FR'), '', '', '', '']);
      csvRows.push(['', '', '', '', '', '']);
      csvRows.push(['Client', 'N° Facture', 'Date', 'Échéance', 'Montant dû', 'Jours de retard']);
      
      invoices.forEach(inv => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
        csvRows.push([
          inv.customer?.accountName || 'Client inconnu',
          inv.invoiceNumber,
          inv.invoiceDate,
          inv.dueDate,
          inv.balanceDue,
          daysOverdue
        ]);
      });
      
      return exportAsCSV(res, `balance_agee_${new Date().toISOString().split('T')[0]}`, csvRows);
    }
    
    // Format PDF
    const agedData = {
      current: { items: [], total: 0 },
      days30: { items: [], total: 0 },
      days60: { items: [], total: 0 },
      days90: { items: [], total: 0 },
      over90: { items: [], total: 0 }
    };
    
    invoices.forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      const item = {
        customerName: inv.customer?.accountName || 'Client inconnu',
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        balanceDue: parseFloat(inv.balanceDue) || 0
      };
      
      if (daysOverdue <= 0) {
        agedData.current.items.push(item);
        agedData.current.total += item.balanceDue;
      } else if (daysOverdue <= 30) {
        agedData.days30.items.push(item);
        agedData.days30.total += item.balanceDue;
      } else if (daysOverdue <= 60) {
        agedData.days60.items.push(item);
        agedData.days60.total += item.balanceDue;
      } else if (daysOverdue <= 90) {
        agedData.days90.items.push(item);
        agedData.days90.total += item.balanceDue;
      } else {
        agedData.over90.items.push(item);
        agedData.over90.total += item.balanceDue;
      }
    });
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `balance_agee_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    doc.fontSize(18).font('Helvetica-Bold').text('BALANCE ÂGÉE CLIENTS', { align: 'center' });
    doc.fontSize(10).text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);
    
    const sections = [
      { title: 'Non échu', data: agedData.current, color: 'green' },
      { title: '1-30 jours', data: agedData.days30, color: 'blue' },
      { title: '31-60 jours', data: agedData.days60, color: 'orange' },
      { title: '61-90 jours', data: agedData.days90, color: 'red' },
      { title: 'Plus de 90 jours', data: agedData.over90, color: 'darkred' }
    ];
    
    sections.forEach(section => {
      if (section.data.items.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text(section.title, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');
        
        section.data.items.forEach(item => {
          doc.text(`${item.customerName} - Facture ${item.invoiceNumber} du ${item.invoiceDate} - Échéance ${item.dueDate} : ${formatMoney(item.balanceDue)}`);
        });
        
        doc.font('Helvetica-Bold');
        doc.text(`Total ${section.title} : ${formatMoney(section.data.total)}`);
        doc.moveDown();
        doc.font('Helvetica');
      }
    });
    
    const grandTotal = agedData.current.total + agedData.days30.total + agedData.days60.total + agedData.days90.total + agedData.over90.total;
    doc.fontSize(12).font('Helvetica-Bold').text(`TOTAL GÉNÉRAL : ${formatMoney(grandTotal)}`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    logger.error('Erreur export balance âgée:', error);
    next(error);
  }
};