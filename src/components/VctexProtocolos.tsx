import React, { useState, useEffect } from 'react';
    import { Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Filter, X, List, FileText, Copy } from 'lucide-react';

    interface Protocolo {
      data: string;
      protocolo: string;
    }

    interface ConsultaResponse {
      slc: {
        body: {
          cpf: string[];
        };
      };
      resposta: {
        message: string;
        batchQueryId: string;
        batchQueriesLimit: number;
        batchQueriesToBeDoneOnThisMonth: number;
        listOfbatchQueriesToBeMadeAtTheEndOfTheDay: string[];
        [key: string]: any;
      };
      [key: string]: any;
    }

    const VctexProtocolos: React.FC = () => {
      // States for API data and loading
      const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
      const [loading, setLoading] = useState<boolean>(true);
      const [error, setError] = useState<string | null>(null);
      
      // States for pagination
      const [currentPage, setCurrentPage] = useState<number>(1);
      const [itemsPerPage, setItemsPerPage] = useState<number>(10);
      const [totalPages, setTotalPages] = useState<number>(1);
      
      // States for filtering
      const [showFilters, setShowFilters] = useState<boolean>(false);
      const [protocoloFilter, setProtocoloFilter] = useState<string>('');
      const [dataFilter, setDataFilter] = useState<string>('');
      const [filteredProtocolos, setFilteredProtocolos] = useState<Protocolo[]>([]);
      
      // Fetch protocolos from API
      const fetchProtocolos = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/vctex/protocolos');
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar protocolos: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.merged && Array.isArray(data.merged)) {
            setProtocolos(data.merged);
            setFilteredProtocolos(data.merged);
            setTotalPages(Math.ceil(data.merged.length / itemsPerPage));
          } else {
            setProtocolos([]);
            setFilteredProtocolos([]);
            setTotalPages(1);
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Erro ao buscar protocolos:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar os protocolos');
          setLoading(false);
        }
      };
      
      // Load protocolos on component mount
      useEffect(() => {
        fetchProtocolos();
      }, []);
      
      // Apply filters whenever filter values change
      useEffect(() => {
        applyFilters();
      }, [protocoloFilter, dataFilter, protocolos]);
      
      // Update total pages whenever filtered results or items per page change
      useEffect(() => {
        setTotalPages(Math.ceil(filteredProtocolos.length / itemsPerPage));
        // Reset to first page when filters change
        setCurrentPage(1);
      }, [filteredProtocolos, itemsPerPage]);
      
      // Function to apply filters
      const applyFilters = () => {
        let filtered = [...protocolos];
        
        // Filter by protocolo number
        if (protocoloFilter) {
          filtered = filtered.filter(p => 
            p.protocolo.includes(protocoloFilter)
          );
        }
        
        // Filter by date
        if (dataFilter) {
          // Convert dataFilter to date format used in the API (YYYY-MM-DD)
          const filterDate = dataFilter.split('T')[0]; // Get only the date part if there's a time component
          
          filtered = filtered.filter(p => 
            p.data.includes(filterDate)
          );
        }
        
        setFilteredProtocolos(filtered);
      };
      
      // Reset filters
      const resetFilters = () => {
        setProtocoloFilter('');
        setDataFilter('');
      };
      
      // Format date for display
      const formatDate = (dateString: string): string => {
        try {
          // Convert from "YYYY-MM-DD HH:MM:SS" to a more readable format
          const date = new Date(dateString);
          return date.toLocaleString('pt-BR');
        } catch (e) {
          return dateString; // Return original string if parsing fails
        }
      };
      
      // Handle page change
      const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
      };
      
      // States for CPF consultation
      const [consultingProtocolo, setConsultingProtocolo] = useState<string | null>(null);
      const [consultaResponse, setConsultaResponse] = useState<string[] | null>(null);
      const [consultaError, setConsultaError] = useState<string | null>(null);
      const [showCpfsModal, setShowCpfsModal] = useState<boolean>(false);
      
      // States for BatchQueryId details
      const [showBatchQueryModal, setShowBatchQueryModal] = useState<boolean>(false);
      const [batchQueryDetails, setBatchQueryDetails] = useState<ConsultaResponse['resposta'] | null>(null);
      const [batchQueryError, setBatchQueryError] = useState<string | null>(null);
      const [viewingBatchQuery, setViewingBatchQuery] = useState<string | null>(null);
      
      // Store the last consulted data to avoid unnecessary API calls
      const [lastConsultedData, setLastConsultedData] = useState<{ 
        protocolo: string; 
        response: ConsultaResponse | null;
      } | null>(null);
      
      // Function to consult CPFs for a specific protocol
      const consultarCpfs = async (protocolo: string) => {
        setConsultingProtocolo(protocolo);
        setConsultaError(null);
        
        try {
          const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/vctex/consultalote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ protocolo })
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao consultar CPFs: ${response.status} ${response.statusText}`);
          }
          
          const data: ConsultaResponse = await response.json();
          
          // Store the full response for potential reuse
          setLastConsultedData({
            protocolo,
            response: data
          });
          
          // Extract CPF list from the response
          if (data.slc && data.slc.body && data.slc.body.cpf && Array.isArray(data.slc.body.cpf)) {
            setConsultaResponse(data.slc.body.cpf);
            setShowCpfsModal(true);
          } else {
            setConsultaError('Formato de resposta inválido ou nenhum CPF encontrado.');
          }
        } catch (err) {
          console.error('Erro ao consultar CPFs:', err);
          setConsultaError(err instanceof Error ? err.message : 'Erro ao consultar os CPFs do protocolo');
        } finally {
          setConsultingProtocolo(null);
        }
      };
      
      // Function to copy CPFs to clipboard
      const copyCpfsToClipboard = () => {
        if (!consultaResponse) return;
        
        const cpfsText = consultaResponse.join('\n');
        navigator.clipboard.writeText(cpfsText).then(() => {
          alert('CPFs copiados para a área de transferência!');
        }).catch(err => {
          console.error('Erro ao copiar CPFs:', err);
        });
      };
      
      // Function to view BatchQueryId details
      const verBatchQueryId = async (protocolo: string) => {
        setViewingBatchQuery(protocolo);
        setBatchQueryError(null);
        setBatchQueryDetails(null);
        
        // Check if we already have the data from a recent consultation
        if (lastConsultedData && lastConsultedData.protocolo === protocolo && lastConsultedData.response) {
          // Reuse the data if it's available
          if (lastConsultedData.response.resposta) {
            setBatchQueryDetails(lastConsultedData.response.resposta);
            setShowBatchQueryModal(true);
            setViewingBatchQuery(null);
            return;
          }
        }
        
        // If we don't have the data, make a new API call
        try {
          const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/vctex/consultalote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ protocolo })
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao consultar detalhes do BatchQuery: ${response.status} ${response.statusText}`);
          }
          
          const data: ConsultaResponse = await response.json();
          
          // Store the full response for potential reuse
          setLastConsultedData({
            protocolo,
            response: data
          });
          
          // Extract BatchQueryId details from the response
          if (data.resposta) {
            setBatchQueryDetails(data.resposta);
            setShowBatchQueryModal(true);
          } else {
            setBatchQueryError('Informações do BatchQueryId não encontradas na resposta.');
          }
        } catch (err) {
          console.error('Erro ao consultar detalhes do BatchQueryId:', err);
          setBatchQueryError(err instanceof Error ? err.message : 'Erro ao consultar detalhes do BatchQueryId');
        } finally {
          setViewingBatchQuery(null);
        }
      };
      
      // Calculate items to display based on current page
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, filteredProtocolos.length);
      const currentItems = filteredProtocolos.slice(startIndex, endIndex);
      
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-800">
                VCTEX Protocolos
              </h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                </button>
                
                <button
                  onClick={fetchProtocolos}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>
            </div>
            
            {/* Filtros */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Filtrar Protocolos</h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Limpar Filtros
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="protocolo-filter" className="block text-xs font-medium text-gray-700 mb-1">
                      Número do Protocolo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="protocolo-filter"
                        value={protocoloFilter}
                        onChange={(e) => setProtocoloFilter(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 pl-9 border"
                        placeholder="Buscar por número do protocolo..."
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="data-filter" className="block text-xs font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="data-filter"
                        value={dataFilter}
                        onChange={(e) => setDataFilter(e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 pl-9 border"
                      />
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Exibição dos resultados */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600">Carregando protocolos...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : filteredProtocolos.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Nenhum protocolo encontrado
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Não foram encontrados protocolos com os filtros selecionados.
                  Tente alterar os filtros ou verificar se existem protocolos cadastrados.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número do Protocolo
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((protocolo, index) => (
                        <tr key={`${protocolo.protocolo}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(protocolo.data)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {protocolo.protocolo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => consultarCpfs(protocolo.protocolo)}
                                disabled={consultingProtocolo === protocolo.protocolo || viewingBatchQuery === protocolo.protocolo}
                                className={`px-3 py-1 rounded text-xs flex items-center ${
                                  consultingProtocolo === protocolo.protocolo
                                    ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {consultingProtocolo === protocolo.protocolo ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Consultando...
                                  </>
                                ) : (
                                  <>
                                    <List className="h-3 w-3 mr-1" />
                                    Consultar CPFs
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => verBatchQueryId(protocolo.protocolo)}
                                disabled={consultingProtocolo === protocolo.protocolo || viewingBatchQuery === protocolo.protocolo}
                                className={`px-3 py-1 rounded text-xs flex items-center ${
                                  viewingBatchQuery === protocolo.protocolo
                                    ? 'bg-green-100 text-green-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {viewingBatchQuery === protocolo.protocolo ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Carregando...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-3 w-3 mr-1" />
                                    Ver BatchQueryId
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Próximo
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{endIndex}</span> de{' '}
                          <span className="font-medium">{filteredProtocolos.length}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          >
                            <span className="sr-only">Anterior</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          
                          {/* Simplified page number display */}
                          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            Página {currentPage} de {totalPages}
                          </span>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          >
                            <span className="sr-only">Próximo</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Modal para exibir os CPFs */}
          {showCpfsModal && (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">
                      CPFs do Protocolo
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCpfsModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                  {consultaError ? (
                    <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>{consultaError}</span>
                    </div>
                  ) : consultaResponse && consultaResponse.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">
                          {consultaResponse.length} CPFs encontrados
                        </p>
                        <button
                          onClick={copyCpfsToClipboard}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar todos
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                          {consultaResponse.map((cpf, index) => (
                            <li key={index} className="py-2 flex items-center justify-between">
                              <span className="text-sm font-mono">{cpf}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(cpf)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copiar CPF"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>Nenhum CPF encontrado para este protocolo.</span>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowCpfsModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal para exibir os detalhes do BatchQueryId */}
          {showBatchQueryModal && (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">
                      Detalhes do BatchQueryId
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowBatchQueryModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                  {batchQueryError ? (
                    <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>{batchQueryError}</span>
                    </div>
                  ) : batchQueryDetails ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Mensagem</h4>
                          <p className="text-sm text-gray-600">{batchQueryDetails.message}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">BatchQueryId</h4>
                          <p className="text-sm font-mono text-gray-600">{batchQueryDetails.batchQueryId}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Limite de Consultas em Lote</h4>
                          <p className="text-sm text-gray-600">{batchQueryDetails.batchQueriesLimit}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Consultas Restantes no Mês</h4>
                          <p className="text-sm text-gray-600">{batchQueryDetails.batchQueriesToBeDoneOnThisMonth}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Lista de BatchQueries Programados para o Fim do Dia
                        </h4>
                        {batchQueryDetails.listOfbatchQueriesToBeMadeAtTheEndOfTheDay.length > 0 ? (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    #
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    ID
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {batchQueryDetails.listOfbatchQueriesToBeMadeAtTheEndOfTheDay.map((id, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                      {index + 1}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-700">
                                      {id}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum BatchQuery programado para o fim do dia.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-12">
                      <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
                      <span className="ml-2 text-gray-600">Carregando detalhes...</span>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowBatchQueryModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default VctexProtocolos;
