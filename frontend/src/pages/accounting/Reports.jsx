import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@utils/formatters';
import toast from 'react-hot-toast';

const Reports = () => {
  const [period, setPeriod] = useState('current-month');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);

  const { data: balanceSheet } = useQuery(
    ['balance-sheet', period],
    () => accountingService.getBalanceSheet({ period })
  );

  const { data: incomeStatement } = useQuery(
    ['income-statement', period],
    () => accountingService.getIncomeStatement({ period })
  );

  const handleExport = async (type) => {
    setExporting(true);
    try {
      await accountingService.exportReport(type, { period, format: exportFormat });
      toast.success(`Rapport exporté avec succès en ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rapports comptables</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  États financiers et rapports
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* ✅ Sélecteur de format PDF/CSV */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    exportFormat === 'pdf' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <DocumentArrowDownIcon className="w-4 h-4 inline mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    exportFormat === 'csv' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <TableCellsIcon className="w-4 h-4 inline mr-1" />
                  CSV (Excel)
                </button>
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input w-48"
              >
                <option value="current-month">Mois en cours</option>
                <option value="previous-month">Mois précédent</option>
                <option value="current-quarter">Trimestre en cours</option>
                <option value="current-year">Année en cours</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card
            title="Bilan"
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => handleExport('balance-sheet')} loading={exporting}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Exporter
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Actif</h4>
                {balanceSheet?.data?.data?.assets?.slice(0, 5).map((asset, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">{asset.accountName || asset.accountNumber}</span>
                    <span className="font-medium">{formatCurrency(asset.balance)}</span>
                  </div>
                ))}
                {(!balanceSheet?.data?.data?.assets || balanceSheet.data.data.assets.length === 0) && (
                  <p className="text-sm text-gray-400 py-2">Aucune donnée</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Passif</h4>
                {balanceSheet?.data?.data?.liabilities?.slice(0, 5).map((liability, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">{liability.accountName || liability.accountNumber}</span>
                    <span className="font-medium">{formatCurrency(liability.balance)}</span>
                  </div>
                ))}
                {(!balanceSheet?.data?.data?.liabilities || balanceSheet.data.data.liabilities.length === 0) && (
                  <p className="text-sm text-gray-400 py-2">Aucune donnée</p>
                )}
              </div>
            </div>
          </Card>

          <Card
            title="Compte de résultat"
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => handleExport('income-statement')} loading={exporting}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Exporter
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Produits</h4>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Total produits</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(incomeStatement?.data?.data?.totalRevenue || 0)}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Charges</h4>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Total charges</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(incomeStatement?.data?.data?.totalExpenses || 0)}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-gray-900">Résultat net</span>
                  <span className={`font-bold ${(incomeStatement?.data?.data?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(incomeStatement?.data?.data?.netIncome || 0)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <DocumentTextIcon className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Balance générale</h3>
            <p className="text-sm text-gray-500 mb-4">Balance des comptes</p>
            <Button variant="outline" fullWidth onClick={() => handleExport('trial-balance')}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </Card>

          <Card className="text-center">
            <TableCellsIcon className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Grand livre</h3>
            <p className="text-sm text-gray-500 mb-4">Détail des écritures</p>
            <Button variant="outline" fullWidth onClick={() => handleExport('general-ledger')}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </Card>

          <Card className="text-center">
            <ChartBarIcon className="w-10 h-10 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Balance âgée</h3>
            <p className="text-sm text-gray-500 mb-4">Créances et dettes</p>
            <Button variant="outline" fullWidth onClick={() => handleExport('aged-balance')}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Reports;