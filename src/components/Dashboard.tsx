import React from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import MetricCard from './MetricCard';

const Dashboard: React.FC = () => {
  // Dados de exemplo para os gráficos
  const statusData = [
    { name: 'Com Saldo', value: 64, color: 'bg-green-500' },
    { name: 'Sem Saldo', value: 28, color: 'bg-gray-400' },
    { name: 'Erro', value: 8, color: 'bg-red-500' },
  ];
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total de Consultas" 
          value="1.253" 
          description="Últimos 30 dias"
          icon={<Search className="h-6 w-6 text-blue-500" />}
          trend="+12% vs mês anterior"
          trendUp={true}
        />
        <MetricCard 
          title="Com Saldo Disponível" 
          value="802" 
          description="64% do total"
          icon={<CheckCircle className="h-6 w-6 text-green-500" />}
          trend="+5% vs mês anterior"
          trendUp={true}
        />
        <MetricCard 
          title="Sem Saldo" 
          value="351" 
          description="28% do total"
          icon={<XCircle className="h-6 w-6 text-gray-500" />}
          trend="-3% vs mês anterior"
          trendUp={false}
        />
        <MetricCard 
          title="Com Erro" 
          value="100" 
          description="8% do total"
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          trend="+2% vs mês anterior"
          trendUp={false}
          negative={true}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Status das Consultas</h2>
          <div className="flex items-center justify-center h-64">
            <div className="w-48 h-48 rounded-full bg-gray-50 relative">
              {statusData.map((item, index) => (
                <div 
                  key={index}
                  className={`absolute top-0 left-0 w-48 h-48 ${item.color}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${100 * index / statusData.length}% 0%, ${100 * (index + 1) / statusData.length}% 0%)`,
                    opacity: 0.8
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col ml-8">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center mb-3">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                  <span className="text-sm text-gray-600">
                    {item.name}: <strong>{item.value}%</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Consultas por Dia</h2>
          <div className="h-64 flex items-end justify-between space-x-2 mt-2">
            {[45, 60, 32, 55, 78, 50, 36].map((value, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-green-100 hover:bg-green-200 transition-all rounded-t w-10" 
                  style={{ height: `${value * 0.8}%` }}
                >
                </div>
                <span className="text-xs text-gray-500 mt-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Campanhas Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome da Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consultas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Com Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Campanha Janeiro/2023</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Concluído
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  320
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  248 (78%)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  10/01/2023
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-green-600 hover:text-green-900 mr-3">
                    Ver
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    Exportar
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Campanha Dezembro/2022</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Concluído
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  450
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  312 (69%)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15/12/2022
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-green-600 hover:text-green-900 mr-3">
                    Ver
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    Exportar
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Campanha Novembro/2022</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Concluído
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  275
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  183 (67%)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  22/11/2022
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-green-600 hover:text-green-900 mr-3">
                    Ver
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    Exportar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
