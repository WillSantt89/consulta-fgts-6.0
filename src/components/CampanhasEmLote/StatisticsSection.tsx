import React from 'react';

interface StatisticsSectionProps {
  estatisticas: {
    total: number;
    comSaldo: number;
    semSaldo: number;
    erro: number;
    pendente: number;
    processamento: number;
  };
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ estatisticas }) => {
  return (
    <>
      {estatisticas.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl font-bold">{estatisticas.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Com Saldo</div>
            <div className="text-xl font-bold text-green-600">{estatisticas.comSaldo}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Sem Saldo</div>
            <div className="text-xl font-bold text-red-600">{estatisticas.semSaldo}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Erro</div>
            <div className="text-xl font-bold text-yellow-600">{estatisticas.erro}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Pendente</div>
            <div className="text-xl font-bold text-blue-600">{estatisticas.pendente}</div>
          </div>
          {/* Removed "Em Processo" statistic */}
          {/* <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Em Processo</div>
            <div className="text-xl font-bold text-purple-600">{estatisticas.processamento}</div>
          </div> */}
        </div>
      )}
    </>
  );
};

export default StatisticsSection;
