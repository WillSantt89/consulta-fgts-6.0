import React from 'react';
import { Play, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { formatarData } from '../../utils';
import { BatchItem } from '../../types';
import { Search } from 'lucide-react';

interface BatchHistoryTableProps {
  apiDataLoading: boolean;
  apiDataError: string | null;
  filteredApiData: BatchItem[];
  handleStartConsultation: (batchId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const BatchHistoryTable: React.FC<BatchHistoryTableProps> = ({
  apiDataLoading,
  apiDataError,
  filteredApiData,
  handleStartConsultation,
  searchQuery,
  setSearchQuery,
}) => {

  const handleStartConsultationClick = async (batchId: string) => {
    try {
      const response = await fetch('https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/iniciando-consulta-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch_id: batchId }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao iniciar a consulta: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Consulta iniciada com sucesso:', data);
      // Optionally, provide user feedback (e.g., a success message)
    } catch (error: any) {
      console.error('Erro ao iniciar a consulta:', error);
      // Optionally, provide user feedback (e.g., an error message)
    }
  };

  return (
    <>
      {/* Search input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por nome do arquivo ou Batch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 px-4 pr-10 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* API Data Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Histórico de Lotes</h3>
        {apiDataLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        ) : apiDataError ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{apiDataError}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome doArquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total de Registros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registros Processados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApiData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.batch_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.processed_records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'processing' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Processando
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Concluído
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Erro
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleStartConsultationClick(item.batch_id)}
                          className="px-3 py-1 rounded text-xs flex items-center bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Play className="h-3 w-3 mr-1" /> Iniciar Consulta
                        </button>
                        <button
                          // onClick={() => handleDeleteBatch(item.batch_id)}
                          className="px-3 py-1 rounded text-xs flex items-center bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default BatchHistoryTable;
