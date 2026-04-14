import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon, TruckIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '@utils/formatters';

const Shipments = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading } = useQuery(
    ['shipments', { page, limit }],
    () => logisticService.getShipments({ page, limit })
  );

  const columns = [
    {
      key: 'shipmentNumber',
      title: 'N° Expédition',
      render: (row) => (
        <div className="flex items-center">
          <TruckIcon className="w-5 h-5 text-blue-500 mr-3" />
          <span className="font-medium">{row.shipmentNumber}</span>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (row) => {
        const types = {
          INBOUND: 'Entrant',
          OUTBOUND: 'Sortant',
          TRANSFER: 'Transfert'
        };
        return types[row.shipmentType] || row.shipmentType;
      }
    },
    {
      key: 'carrier',
      title: 'Transporteur',
      render: (row) => row.carrierName || '-'
    },
    {
      key: 'origin',
      title: 'Origine',
      render: (row) => row.originWarehouse?.warehouseName || row.originAddress || '-'
    },
    {
      key: 'destination',
      title: 'Destination',
      render: (row) => row.destinationWarehouse?.warehouseName || row.destinationAddress || '-'
    },
    {
      key: 'scheduledDeparture',
      title: 'Départ prévu',
      render: (row) => formatDateTime(row.scheduledDeparture)
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          PLANNED: { label: 'Planifiée', color: 'blue' },
          IN_TRANSIT: { label: 'En transit', color: 'orange' },
          DELAYED: { label: 'Retardée', color: 'red' },
          DELIVERED: { label: 'Livrée', color: 'green' },
          CANCELLED: { label: 'Annulée', color: 'gray' }
        };
        const s = statuses[row.status] || { label: row.status, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      }
    }
  ];

  // ✅ Extraction correcte des données
  const shipmentsData = data?.data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expéditions</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des expéditions et livraisons
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/logistics/shipments/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvelle expédition
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <Table
            columns={columns}
            data={shipmentsData}
            loading={isLoading}
            onRowClick={(row) => navigate(`/logistics/shipments/${row.id}`)}
            emptyMessage="Aucune expédition trouvée"
          />
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Shipments;