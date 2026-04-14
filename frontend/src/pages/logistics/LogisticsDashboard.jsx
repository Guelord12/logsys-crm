import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import StatCard from '@components/charts/StatCard';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  BuildingOfficeIcon,
  CubeIcon,
  ArrowPathIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@utils/formatters';

const LogisticsDashboard = () => {
  const { data: dashboardData } = useQuery(
    'logistics-dashboard',
    () => logisticService.getDashboard()
  );

  const { data: recentMovements } = useQuery(
    'recent-movements',
    () => logisticService.getMovements({ page: 1, limit: 5 })
  );

  const { data: lowStockItems } = useQuery(
    'low-stock',
    () => logisticService.getLowStock()
  );

  // ✅ Helpers pour extraire les données quel que soit le format
  const stats = dashboardData?.data?.stats || dashboardData?.stats || {};
  
  const getMovementsArray = () => {
    const data = recentMovements?.data;
    if (!data) return [];
    // Si data.movements existe
    if (data.movements && Array.isArray(data.movements)) return data.movements;
    // Si data.data.movements existe
    if (data.data?.movements && Array.isArray(data.data.movements)) return data.data.movements;
    // Si data est directement un tableau
    if (Array.isArray(data)) return data;
    return [];
  };

  const getLowStockArray = () => {
    const data = lowStockItems?.data;
    if (!data) return [];
    // Si data est directement un tableau
    if (Array.isArray(data)) return data;
    // Si data.data est un tableau
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const movements = getMovementsArray();
  const lowStock = getLowStockArray();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Logistique</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tableau de bord logistique
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Entrepôts"
            value={stats.totalWarehouses || 0}
            icon={BuildingOfficeIcon}
            color="blue"
          />
          <StatCard
            title="Articles"
            value={stats.totalItems || 0}
            icon={CubeIcon}
            color="green"
          />
          <StatCard
            title="Valeur du stock"
            value={formatCurrency(stats.totalInventoryValue || 0)}
            icon={ClipboardDocumentListIcon}
            color="purple"
          />
          <StatCard
            title="Commandes en attente"
            value={stats.pendingOrders || 0}
            icon={TruckIcon}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card 
              title="Mouvements récents"
              headerAction={
                <Link to="/logistics/movements" className="text-sm text-blue-600 hover:text-blue-700">
                  Voir tout
                </Link>
              }
            >
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        movement.movementType === 'RECEIPT' ? 'bg-green-500' :
                        movement.movementType === 'ISSUE' ? 'bg-red-500' :
                        movement.movementType === 'TRANSFER' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium">{movement.item?.itemName}</p>
                        <p className="text-sm text-gray-500">
                          {movement.quantity} {movement.item?.unitOfMeasure} • {movement.movementType}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {movement.created_at ? new Date(movement.created_at).toLocaleDateString() : 
                       movement.movementDate ? new Date(movement.movementDate).toLocaleDateString() : 
                       '-'}
                    </span>
                  </div>
                ))}
                {movements.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Aucun mouvement récent</p>
                )}
              </div>
            </Card>

            <Card title="Accès rapides">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/logistics/warehouses" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">Entrepôts</span>
                </Link>
                <Link to="/logistics/inventory" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-center">
                  <CubeIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">Stocks</span>
                </Link>
                <Link to="/logistics/purchase-orders" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-center">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">Commandes</span>
                </Link>
                <Link to="/logistics/shipments" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 text-center">
                  <TruckIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium">Expéditions</span>
                </Link>
              </div>
            </Card>
          </div>

          <Card 
            title="Alertes de stock"
            headerAction={
              <Link to="/logistics/inventory?lowStock=true" className="text-sm text-blue-600 hover:text-blue-700">
                Voir tout
              </Link>
            }
          >
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.item?.itemName}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {item.quantityAvailable} {item.item?.unitOfMeasure}
                    </p>
                    <p className="text-xs text-gray-500">
                      Minimum: {item.item?.minStockLevel} • Entrepôt: {item.warehouse?.warehouseName}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                </div>
              ))}
              {lowStock.length === 0 && (
                <p className="text-center text-gray-500 py-4">Aucune alerte de stock</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LogisticsDashboard;