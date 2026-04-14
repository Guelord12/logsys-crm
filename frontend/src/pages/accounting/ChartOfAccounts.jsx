import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { MagnifyingGlassIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ChartOfAccounts = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState([]);

  const { data, isLoading } = useQuery(
    ['chart-of-accounts', { search, class: selectedClass }],
    () => accountingService.getChartOfAccounts({ search, class: selectedClass })
  );

  // ✅ Extraction correcte selon la structure Axios : response.data.data
  const accounts = data?.data?.data || [];

  const classes = [
    { value: '1', label: 'Classe 1 - Capitaux propres' },
    { value: '2', label: 'Classe 2 - Immobilisations' },
    { value: '3', label: 'Classe 3 - Stocks' },
    { value: '4', label: 'Classe 4 - Tiers' },
    { value: '5', label: 'Classe 5 - Trésorerie' },
    { value: '6', label: 'Classe 6 - Charges' },
    { value: '7', label: 'Classe 7 - Produits' }
  ];

  const toggleExpand = (accountNumber) => {
    setExpandedAccounts(prev =>
      prev.includes(accountNumber)
        ? prev.filter(a => a !== accountNumber)
        : [...prev, accountNumber]
    );
  };

  const getAccountTypeBadge = (type) => {
    const types = {
      ASSET: { label: 'Actif', color: 'blue' },
      LIABILITY: { label: 'Passif', color: 'orange' },
      EQUITY: { label: 'Capitaux', color: 'green' },
      REVENUE: { label: 'Produit', color: 'purple' },
      EXPENSE: { label: 'Charge', color: 'red' }
    };
    const t = types[type] || { label: type, color: 'gray' };
    return <Badge variant={t.color}>{t.label}</Badge>;
  };

  const columns = [
    {
      key: 'accountNumber',
      title: 'Numéro',
      render: (row) => (
        <div className="flex items-center">
          {row.children?.length > 0 && (
            <button onClick={() => toggleExpand(row.accountNumber)} className="mr-2">
              {expandedAccounts.includes(row.accountNumber) ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          <span className={clsx(row.isHeading && 'font-bold')}>{row.accountNumber}</span>
        </div>
      )
    },
    {
      key: 'accountName',
      title: 'Libellé',
      render: (row) => (
        <span className={clsx(row.isHeading && 'font-bold')}>{row.accountName}</span>
      )
    },
    {
      key: 'accountType',
      title: 'Type',
      render: (row) => row.accountType ? getAccountTypeBadge(row.accountType) : '-'
    },
    {
      key: 'allowsDirectPosting',
      title: 'Saisie directe',
      render: (row) => row.allowsDirectPosting ? (
        <Badge variant="success">Oui</Badge>
      ) : (
        <Badge variant="gray">Non</Badge>
      )
    }
  ];

  // Filtrer les comptes enfants pour l'affichage hiérarchique
  const getVisibleAccounts = () => {
    const visible = [];
    const accountMap = new Map();
    
    accounts.forEach(acc => accountMap.set(acc.accountNumber, acc));
    
    accounts.forEach(acc => {
      if (!acc.parentAccountNumber) {
        visible.push(acc);
        if (expandedAccounts.includes(acc.accountNumber)) {
          const children = accounts.filter(a => a.parentAccountNumber === acc.accountNumber);
          visible.push(...children);
        }
      }
    });
    
    return visible;
  };

  const visibleAccounts = getVisibleAccounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plan comptable OHADA</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Plan comptable général selon les normes OHADA
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un compte..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-64"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={visibleAccounts}
            loading={isLoading}
            emptyMessage="Aucun compte trouvé"
          />
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default ChartOfAccounts;