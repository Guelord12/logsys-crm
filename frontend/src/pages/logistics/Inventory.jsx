import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Pagination from '@components/common/Pagination';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Inventory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading, refetch } = useQuery(
    ['inventory', { page, limit, search, warehouseId, categoryId, lowStock: showLowStock }],
    () => logisticService.getInventory({ page, limit, search, warehouseId, categoryId, lowStock: showLowStock })
  );

  const { data: warehouses } = useQuery(
    'warehouses',
    () => logisticService.getWarehouses()
  );

  const { data: categories } = useQuery(
    'categories',
    () => logisticService.getCategories()
  );

  const { data: lowStockItems } = useQuery(
    'low-stock',
    () => logisticService.getLowStock()
  );

  // ✅ Extraction correcte des données
  const inventory = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};
  const warehousesData = warehouses?.data?.data || [];
  const categoriesData = categories?.data?.data || [];
  const lowStockCount = lowStockItems?.data?.data?.length || 0;

  const columns = [
    {
      key: 'item',
      title: 'Article',
      render: (row) => (
        <div>
          <p className="font-medium">{row.item?.itemName}</p>
          <p className="text-sm text-gray-500">{row.item?.itemCode}</p>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Catégorie',
      render: (row) => row.item?.category?.categoryName || '-'
    },
    {
      key: 'warehouse',
      title: 'Entrepôt',
      render: (row) => row.warehouse?.warehouseName || '-'
    },
    {
      key: 'location',
      title: 'Emplacement',
      render: (row) => {
        const loc = [];
        if (row.zone) loc.push(row.zone);
        if (row.aisle) loc.push(row.aisle);
        if (row.rack) loc.push(row.rack);
        if (row.shelf) loc.push(row.shelf);
        return loc.join(' - ') || '-';
      }
    },
    {
      key: 'quantity',
      title: 'Quantité',
      render: (row) => (
        <div>
          <p className="font-medium">{row.quantityOnHand} {row.item?.unitOfMeasure}</p>
          <p className="text-xs text-gray-500">
            Disponible: {row.quantityAvailable} | Réservé: {row.quantityReserved}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const minStock = row.item?.minStockLevel || 0;
        const available = row.quantityAvailable || 0;
        
        if (available <= 0) {
          return <Badge variant="danger">Rupture</Badge>;
        } else if (available <= minStock) {
          return <Badge variant="warning">Stock bas</Badge>;
        }
        return <Badge variant="success">Normal</Badge>;
      }
    },
    {
      key: 'lastMovement',
      title: 'Dernier mouvement',
      render: (row) => row.lastMovementAt ? new Date(row.lastMovementAt).toLocaleDateString() : '-'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stocks</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des stocks et inventaire
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/logistics/inventory/movement/new')}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Nouveau mouvement
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        {lowStockCount > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-3" />
            <span className="text-orange-700">
              <strong>{lowStockCount}</strong> article(s) en stock bas ou en rupture
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              {showLowStock ? 'Voir tout' : 'Voir uniquement'}
            </Button>
          </div>
        )}

        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="input w-48"
              >
                <option value="">Tous les entrepôts</option>
                {warehousesData.map(w => (
                  <option key={w.id} value={w.id}>{w.warehouseName}</option>
                ))}
              </select>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input w-48"
              >
                <option value="">Toutes les catégories</option>
                {categoriesData.map(c => (
                  <option key={c.id} value={c.id}>{c.categoryName}</option>
                ))}
              </select>

              <Button variant="secondary" onClick={() => refetch()}>
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={inventory}
            loading={isLoading}
            onRowClick={(row) => navigate(`/logistics/items/${row.itemId}`)}
            emptyMessage="Aucun stock trouvé"
          />

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Inventory;