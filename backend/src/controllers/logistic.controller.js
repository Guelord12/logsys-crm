const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const logger = require('../utils/logger');
const { createNotification } = require('../services/notification.service');

const {
  Warehouse,
  LogisticItem,
  LogisticCategory,
  Inventory,
  InventoryBatch,
  InventoryMovement,
  PurchaseOrder,
  PurchaseOrderLine,
  Shipment,
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
 * Tableau de bord logistique
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const totalWarehouses = await Warehouse.count({ where: whereCompany });
    const totalItems = await LogisticItem.count({ where: whereCompany });
    
    const inventoryValue = await Inventory.findAll({
      where: whereCompany,
      paranoid: false,
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('quantity_on_hand * unit_cost')), 'total']
      ],
      raw: true
    });

    const recentMovements = await InventoryMovement.findAll({
      where: whereCompany,
      paranoid: false,
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        { model: LogisticItem, as: 'item' },
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' }
      ]
    });

    const lowStockItems = await Inventory.findAll({
      where: {
        ...whereCompany,
        quantityAvailable: {
          [Op.lte]: Sequelize.col('item.min_stock_level')
        }
      },
      paranoid: false,
      include: [
        { model: LogisticItem, as: 'item' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });

    const pendingOrders = await PurchaseOrder.count({
      where: {
        ...whereCompany,
        status: { [Op.in]: ['DRAFT', 'SUBMITTED', 'APPROVED'] }
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalWarehouses,
          totalItems,
          totalInventoryValue: parseFloat(inventoryValue[0]?.total || 0),
          pendingOrders,
          lowStockCount: lowStockItems.length
        },
        recentMovements,
        lowStockItems
      }
    });

  } catch (error) {
    logger.error('Erreur dashboard logistique:', error);
    next(error);
  }
};

/**
 * Gestion des entrepôts
 */
exports.getWarehouses = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const warehouses = await Warehouse.findAll({
      where: whereCompany,
      include: [{
        model: Inventory,
        as: 'inventory',
        include: ['item']
      }],
      order: [['warehouseName', 'ASC']]
    });

    res.json({
      success: true,
      data: warehouses
    });

  } catch (error) {
    logger.error('Erreur récupération entrepôts:', error);
    next(error);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create({
      ...req.body,
      companyId: req.user.companyId,
      warehouseCode: `WH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    });

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      actionDescription: `Création entrepôt ${warehouse.warehouseName}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: warehouse
    });

  } catch (error) {
    logger.error('Erreur création entrepôt:', error);
    next(error);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const whereCompany = getCompanyWhere(req.user);
    const warehouse = await Warehouse.findOne({
      where: { id, ...whereCompany }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé'
      });
    }

    await warehouse.update(req.body);

    res.json({
      success: true,
      data: warehouse
    });

  } catch (error) {
    logger.error('Erreur mise à jour entrepôt:', error);
    next(error);
  }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const whereCompany = getCompanyWhere(req.user);
    const warehouse = await Warehouse.findOne({
      where: { id, ...whereCompany }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Entrepôt non trouvé'
      });
    }

    const hasInventory = await Inventory.count({ where: { warehouseId: id } });
    if (hasInventory > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un entrepôt contenant du stock'
      });
    }

    await warehouse.destroy();

    res.json({
      success: true,
      message: 'Entrepôt supprimé avec succès'
    });

  } catch (error) {
    logger.error('Erreur suppression entrepôt:', error);
    next(error);
  }
};

/**
 * Gestion des catégories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const categories = await LogisticCategory.findAll({
      where: { ...whereCompany, isActive: true },
      order: [['categoryName', 'ASC']],
      paranoid: false
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Erreur récupération catégories:', error);
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await LogisticCategory.create({
      ...req.body,
      companyId: req.user.companyId,
      categoryCode: `CAT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    logger.error('Erreur création catégorie:', error);
    next(error);
  }
};

/**
 * Gestion des articles
 */
exports.getItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      itemType
    } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    if (search) {
      where[Op.or] = [
        { itemCode: { [Op.like]: `%${search}%` } },
        { itemName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (itemType) where.itemType = itemType;

    const { count, rows: items } = await LogisticItem.findAndCountAll({
      where,
      include: [
        { model: LogisticCategory, as: 'category' },
        { model: Inventory, as: 'inventory', include: ['warehouse'] }
      ],
      order: [['itemName', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération articles:', error);
    next(error);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    const itemCode = `ART${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const item = await LogisticItem.create({
      ...req.body,
      companyId: req.user.companyId,
      itemCode
    });

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'LOGISTIC_ITEM',
      entityId: item.id,
      actionDescription: `Création article ${item.itemName}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: item
    });

  } catch (error) {
    logger.error('Erreur création article:', error);
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const whereCompany = getCompanyWhere(req.user);
    const item = await LogisticItem.findOne({
      where: { id, ...whereCompany }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    await item.update(req.body);

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    logger.error('Erreur mise à jour article:', error);
    next(error);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const whereCompany = getCompanyWhere(req.user);
    const item = await LogisticItem.findOne({
      where: { id, ...whereCompany }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    const hasInventory = await Inventory.count({ where: { itemId: id } });
    if (hasInventory > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un article avec du stock'
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Article supprimé'
    });

  } catch (error) {
    logger.error('Erreur suppression article:', error);
    next(error);
  }
};

/**
 * Gestion des stocks
 */
exports.getInventory = async (req, res, next) => {
  try {
    const { warehouseId, itemId, categoryId, lowStock } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    if (warehouseId) where.warehouseId = warehouseId;
    if (itemId) where.itemId = itemId;

    const inventory = await Inventory.findAll({
      where,
      paranoid: false,
      include: [
        { model: Warehouse, as: 'warehouse' },
        { 
          model: LogisticItem, 
          as: 'item',
          include: ['category'],
          where: categoryId ? { categoryId } : {}
        }
      ]
    });

    let filteredInventory = inventory;
    if (lowStock === 'true') {
      filteredInventory = inventory.filter(inv => 
        inv.quantityAvailable <= inv.item.minStockLevel
      );
    }

    res.json({
      success: true,
      data: filteredInventory
    });

  } catch (error) {
    logger.error('Erreur récupération stocks:', error);
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const lowStock = await Inventory.findAll({
      where: {
        ...whereCompany,
        quantityAvailable: { [Op.lte]: Sequelize.col('item.min_stock_level') }
      },
      paranoid: false,
      include: [
        { model: LogisticItem, as: 'item' },
        { model: Warehouse, as: 'warehouse' }
      ]
    });

    res.json({ success: true, data: lowStock });
  } catch (error) {
    logger.error('Erreur récupération stocks bas:', error);
    next(error);
  }
};

/**
 * Mouvements de stock
 */
exports.getMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, itemId, warehouseId, movementType } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };
    
    if (itemId) where.itemId = itemId;
    if (movementType) where.movementType = movementType;
    if (warehouseId) {
      where[Op.or] = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
    }

    const { count, rows: movements } = await InventoryMovement.findAndCountAll({
      where,
      paranoid: false,
      include: [
        { model: LogisticItem, as: 'item' },
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération mouvements:', error);
    next(error);
  }
};

exports.createMovement = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      movementType,
      fromWarehouseId,
      toWarehouseId,
      itemId,
      batchId,
      quantity,
      unitCost,
      referenceType,
      referenceId,
      referenceNumber,
      notes
    } = req.body;

    const movementCode = `MOV${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const movement = await InventoryMovement.create({
      companyId: req.user.companyId,
      movementCode,
      movementType,
      fromWarehouseId,
      toWarehouseId,
      itemId,
      batchId,
      quantity,
      unitCost,
      totalCost: quantity * (unitCost || 0),
      referenceType,
      referenceId,
      referenceNumber,
      notes,
      status: 'PENDING',
      createdBy: req.user.id
    }, { transaction });

    await transaction.commit();

    // Mettre à jour les stocks
    await updateInventoryLevels(movement);

    await AuditLog.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      actionType: 'CREATE',
      entityType: 'INVENTORY_MOVEMENT',
      entityId: movement.id,
      actionDescription: `Création mouvement stock ${movementCode}`,
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: movement
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur création mouvement:', error);
    next(error);
  }
};

/**
 * Gestion des lots
 */
exports.getBatches = async (req, res, next) => {
  try {
    const { itemId, status } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };
    
    if (itemId) where.itemId = itemId;
    if (status) where.qualityCheckStatus = status;

    const batches = await InventoryBatch.findAll({
      where,
      include: [{ model: LogisticItem, as: 'item' }],
      order: [['expiryDate', 'ASC']]
    });

    res.json({ success: true, data: batches });
  } catch (error) {
    logger.error('Erreur récupération lots:', error);
    next(error);
  }
};

exports.createBatch = async (req, res, next) => {
  try {
    const batchNumber = `BAT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const batch = await InventoryBatch.create({
      ...req.body,
      companyId: req.user.companyId,
      batchNumber,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    logger.error('Erreur création lot:', error);
    next(error);
  }
};

/**
 * Commandes fournisseurs
 */
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      supplierId,
      startDate,
      endDate
    } = req.query;

    const whereCompany = getCompanyWhere(req.user);
    const where = { ...whereCompany };

    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate && endDate) {
      where.orderDate = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows: orders } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'warehouse' },
        { model: PurchaseOrderLine, as: 'lines', include: ['item'], paranoid: false }
      ],
      order: [['orderDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Erreur récupération commandes:', error);
    next(error);
  }
};

exports.createPurchaseOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      supplierId,
      supplierName,
      supplierReference,
      warehouseId,
      orderDate,
      expectedDeliveryDate,
      lines,
      notes,
      terms
    } = req.body;

    const poNumber = `PO${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;

    let subtotal = 0;
    lines.forEach(line => {
      subtotal += line.quantityOrdered * line.unitPrice;
    });

    const order = await PurchaseOrder.create({
      companyId: req.user.companyId,
      poNumber,
      supplierId,
      supplierName,
      supplierReference,
      warehouseId,
      orderDate,
      expectedDeliveryDate,
      subtotal,
      totalAmount: subtotal,
      status: 'DRAFT',
      notes,
      terms,
      createdBy: req.user.id
    }, { transaction });

    await PurchaseOrderLine.bulkCreate(
      lines.map((line, index) => ({
        purchaseOrderId: order.id,
        lineNumber: index + 1,
        itemId: line.itemId,
        description: line.description,
        quantityOrdered: line.quantityOrdered,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate || 0,
        discountPercent: line.discountPercent || 0,
        lineTotal: line.quantityOrdered * line.unitPrice,
        expectedDeliveryDate: line.expectedDeliveryDate
      })),
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Erreur création commande:', error);
    next(error);
  }
};

exports.approvePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const whereCompany = getCompanyWhere(req.user);
    const order = await PurchaseOrder.findOne({
      where: { id, ...whereCompany }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    await order.update({
      status: 'APPROVED',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    res.json({ success: true, message: 'Commande approuvée' });
  } catch (error) {
    logger.error('Erreur approbation commande:', error);
    next(error);
  }
};

exports.receivePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lines } = req.body;

    const whereCompany = getCompanyWhere(req.user);
    const order = await PurchaseOrder.findByPk(id, { include: ['lines'] });
    
    if (!order || (whereCompany.companyId && order.companyId !== whereCompany.companyId)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    for (const line of lines) {
      const orderLine = order.lines.find(l => l.id === line.lineId);
      if (orderLine) {
        await orderLine.update({ quantityReceived: line.quantityReceived });

        if (line.quantityReceived > 0) {
          await InventoryMovement.create({
            companyId: req.user.companyId,
            movementType: 'RECEIPT',
            toWarehouseId: order.warehouseId,
            itemId: orderLine.itemId,
            quantity: line.quantityReceived,
            unitCost: orderLine.unitPrice,
            referenceType: 'PURCHASE_ORDER',
            referenceId: order.id,
            referenceNumber: order.poNumber,
            createdBy: req.user.id
          });
        }
      }
    }

    const allReceived = order.lines.every(l => l.quantityReceived >= l.quantityOrdered);
    await order.update({
      status: allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
      actualDeliveryDate: new Date()
    });

    res.json({ success: true, message: 'Réception enregistrée' });
  } catch (error) {
    logger.error('Erreur réception commande:', error);
    next(error);
  }
};

exports.cancelPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const whereCompany = getCompanyWhere(req.user);
    const order = await PurchaseOrder.findOne({
      where: { id, ...whereCompany }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    await order.update({ status: 'CANCELLED' });

    res.json({ success: true, message: 'Commande annulée' });
  } catch (error) {
    logger.error('Erreur annulation commande:', error);
    next(error);
  }
};

/**
 * Expéditions
 */
exports.getShipments = async (req, res, next) => {
  try {
    const whereCompany = getCompanyWhere(req.user);

    const shipments = await Shipment.findAll({
      where: whereCompany,
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: shipments });
  } catch (error) {
    logger.error('Erreur récupération expéditions:', error);
    next(error);
  }
};

exports.createShipment = async (req, res, next) => {
  try {
    const shipmentNumber = `SHP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const shipment = await Shipment.create({
      ...req.body,
      companyId: req.user.companyId,
      shipmentNumber,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    logger.error('Erreur création expédition:', error);
    next(error);
  }
};

exports.updateShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const whereCompany = getCompanyWhere(req.user);
    const shipment = await Shipment.findOne({
      where: { id, ...whereCompany }
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Expédition non trouvée' });
    }

    const updates = { status };
    if (status === 'IN_TRANSIT') updates.actualDeparture = new Date();
    if (status === 'DELIVERED') updates.actualArrival = new Date();

    await shipment.update(updates);

    res.json({ success: true, data: shipment });
  } catch (error) {
    logger.error('Erreur mise à jour statut expédition:', error);
    next(error);
  }
};

// Fonction helper pour mettre à jour les niveaux de stock
async function updateInventoryLevels(movement) {
  try {
    const { movementType, fromWarehouseId, toWarehouseId, itemId, quantity } = movement;

    switch (movementType) {
      case 'RECEIPT':
        await Inventory.increment('quantityOnHand', { 
          by: quantity, 
          where: { warehouseId: toWarehouseId, itemId } 
        });
        break;
      case 'ISSUE':
        await Inventory.decrement('quantityOnHand', { 
          by: quantity, 
          where: { warehouseId: fromWarehouseId, itemId } 
        });
        break;
      case 'TRANSFER':
        await Inventory.decrement('quantityOnHand', { 
          by: quantity, 
          where: { warehouseId: fromWarehouseId, itemId } 
        });
        await Inventory.increment('quantityOnHand', { 
          by: quantity, 
          where: { warehouseId: toWarehouseId, itemId } 
        });
        break;
    }

    await Inventory.update(
      {
        quantityAvailable: Sequelize.literal('quantity_on_hand - quantity_reserved'),
        lastMovementAt: new Date()
      },
      {
        where: {
          itemId,
          warehouseId: { [Op.in]: [fromWarehouseId, toWarehouseId].filter(Boolean) }
        }
      }
    );

    await movement.update({
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: movement.createdBy
    });

    const inventory = await Inventory.findOne({
      where: { itemId, warehouseId: toWarehouseId || fromWarehouseId },
      include: ['item']
    });

    if (inventory && inventory.quantityAvailable <= inventory.item.minStockLevel) {
      await createNotification({
        companyId: movement.companyId,
        type: 'STOCK_ALERT',
        title: 'Alerte de stock bas',
        message: `Stock bas pour ${inventory.item.itemName}: ${inventory.quantityAvailable} ${inventory.item.unitOfMeasure}`,
        priority: 'HIGH'
      });
    }

  } catch (error) {
    logger.error('Erreur mise à jour stocks:', error);
    throw error;
  }
}