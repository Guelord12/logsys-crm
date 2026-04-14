// frontend/src/pages/company/OrganizationChart.jsx

import React, { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { departmentService } from '@services/department.service';
import Card from '@components/common/Card';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import Loader from '@components/common/Loader';
import { BuildingOfficeIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { OrganizationChart as OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';

const OrganizationChart = () => {
  const chartRef = useRef(null);
  
  const { data, isLoading } = useQuery(
    'organization-chart',
    () => departmentService.getOrganizationChart()
  );
  
  useEffect(() => {
    if (data?.data?.chart && chartRef.current) {
      renderChart(data.data.chart);
    }
  }, [data]);
  
  const renderChart = (chartData) => {
    // Nettoyer le conteneur
    d3.select(chartRef.current).selectAll('*').remove();
    
    if (!chartData || chartData.length === 0) {
      return;
    }
    
    // Créer le graphique
    const chart = new OrgChart()
      .container(chartRef.current)
      .data(chartData)
      .nodeHeight(80)
      .nodeWidth(200)
      .childrenMargin(50)
      .compactMarginBetween(25)
      .compactMarginPair(50)
      .neighbourMargin(50)
      .siblingsMargin(50)
      .buttonContent(({ node, state }) => {
        return `<div style="text-align:center;background:${node.data.color || '#4A90E2'};color:white;border-radius:8px;padding:12px;">
          <div style="font-weight:bold">${node.data.name}</div>
          <div style="font-size:12px;margin-top:4px">${node.data.employees?.length || 0} employés</div>
        </div>`;
      })
      .linkUpdate((d, i, arr) => {
        d3.select(this)
          .attr('stroke', '#CBD5E1')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,4');
      })
      .render();
  };
  
  const departments = data?.data?.departments || [];
  const stats = data?.data?.stats || [];
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organigramme</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Structure organisationnelle de l'entreprise
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-container">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Départements</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Employés</p>
                <p className="text-2xl font-bold">
                  {stats.reduce((sum, d) => sum + parseInt(d.total_employees || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <ChevronRightIcon className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Niveaux hiérarchiques</p>
                <p className="text-2xl font-bold">
                  {Math.max(...departments.map(d => d.hierarchyLevel || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Graphique d'organigramme */}
        <Card className="mb-6 overflow-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Structure hiérarchique</h3>
            <div 
              ref={chartRef} 
              className="org-chart-container" 
              style={{ minHeight: '500px', width: '100%' }}
            />
          </div>
        </Card>
        
        {/* Liste des départements */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Liste des départements</h3>
            <div className="space-y-2">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: dept.color || '#4A90E2' }}
                    />
                    <div>
                      <p className="font-medium">{dept.departmentName}</p>
                      <p className="text-sm text-gray-500">
                        Manager: {dept.manager?.fullName || 'Non assigné'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {stats.find(s => s.id === dept.id)?.total_employees || 0} employés
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.find(s => s.id === dept.id)?.active_tasks || 0} tâches actives
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrganizationChart;