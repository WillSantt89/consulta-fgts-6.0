import React from 'react';
import { Play, Pause, X, Download } from 'lucide-react';
import { BatchItem, ProcessedResult } from '../../types';

interface CampaignControlSectionProps {
  batchId: string | null;
  batchStatus: string | null;
  campaignStatus: 'idle' | 'running' | 'paused';
  startCampaign: () => void;
  pauseCampaign: () => void;
  resumeCampaign: () => void;
  stopCampaign: () => void;
  downloadResults: () => void;
  processedCount: number;
  totalRecords: number;
  processingProgress: number;
  stats: {
    total: number;
    comSaldo: number;
    semSaldo: number;
    erro: number;
    pendente: number;
    processamento: number;
  };
  batchInvalidRecords: any[];
}

const CampaignControlSection: React.FC<CampaignControlSectionProps> = ({
  batchId,
  batchStatus,
  campaignStatus,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  downloadResults,
  processedCount,
  totalRecords,
  processingProgress,
  stats,
  batchInvalidRecords,
}) => {
  return (
    <>
      {(batchId || stats.total > 0) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Gerenciamento da Campanha</h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              {batchId && <p className="text-sm text-gray-600">Batch ID: {batchId}</p>}
              {batchStatus && <p className="text-sm text-gray-600">Status: {batchStatus}</p>}
            </div>
            <div className="flex items-center space-x-2">
              {campaignStatus === 'idle' && (
                <button
                  onClick={startCampaign}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                >
                  <Play className="h-4 w-4 mr-1" /> Iniciar
                </button>
              )}
              {campaignStatus === 'running' && (
                <>
                  <button
                    onClick={pauseCampaign}
                    className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
                  >
                    <Pause className="h-4 w-4 mr-1" /> Pausar
                  </button>
                </>
              )}
              {campaignStatus === 'paused' && (
                <>
                  <button
                    onClick={resumeCampaign}
                    className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <Play className="h-4 w-4 mr-1" /> Retomar
                  </button>
                </>
              )}
              {(campaignStatus === 'running' || campaignStatus === 'paused') && (
                <button
                  onClick={stopCampaign}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" /> Parar
                </button>
              )}
              <button
                onClick={downloadResults}
                disabled={stats.total === 0}
                className={`px-3 py-2 ${
                  stats.total === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } rounded-md flex items-center`}
              >
                <Download className="h-4 w-4 mr-1" /> Exportar
                </button>
            </div>
          </div>

          {/* Barra de progresso */}
          {totalRecords > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Progresso: {processedCount} / {totalRecords} ({processingProgress}%)
              </p>
            </div>
          )}

          {/* Estatísticas */}
          {stats.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Com Saldo</div>
                <div className="text-xl font-bold text-green-600">{stats.comSaldo}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Sem Saldo</div>
                <div className="text-xl font-bold text-red-600">{stats.semSaldo}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Erro</div>
                <div className="text-xl font-bold text-yellow-600">{stats.erro}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Pendente</div>
                <div className="text-xl font-bold text-blue-600">{stats.pendente}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Em Processo</div>
                <div className="text-xl font-bold text-purple-600">{stats.processamento}</div>
              </div>
            </div>
          )}

          {batchInvalidRecords.length > 0 && (
            <div className="mt-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                <h3 className="text-sm font-medium">Registros Inválidos:</h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {batchInvalidRecords.map((record, index) => (
                    <li key={index}>
                      CPF: {record.cpf}, Nome: {record.nome}, Erro: {record.erro}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CampaignControlSection;
