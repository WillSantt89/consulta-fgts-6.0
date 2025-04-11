import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Filter, 
  FileJson, 
  X,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Consulta {
  id: number;
  batch_id: string;
  request_id: string;
  cpf: string;
  nome: string;
  telefone: string;
  status: string;
  valor_liberado: string;
  banco: string;
  mensagem: string;
  log: string;
  api_response: any;
  created_at: string;
}

const HistoricoConsultas: React.FC = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [filteredConsultas, setFilteredConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [bancoFilter, setBancoFilter] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '', 
    end: new Date().toISOString().split('T')[0]
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default items per page
  const [totalPages, setTotalPages] = useState<number>(1);

  // Define estatísticas
  const [statistics, setStatistics] = useState({
    total: 0,
    comSaldo: 0,
    semSaldo: 0,
    erro: 0
  });

  // Carrega as consultas da API
  const fetchConsultas = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/inserindo-consulta');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar histórico: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setConsultas(data);
      setFilteredConsultas(data);
      calculateStatistics(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico de consultas');
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calculateStatistics = (data: Consulta[]) => {
    const stats = {
      total: data.length,
      comSaldo: data.filter(c => c.status === 'com_saldo').length,
      semSaldo: data.filter(c => c.status === 'sem_saldo').length,
      erro: data.filter(c => c.status !== 'com_saldo' && c.status !== 'sem_saldo').length
    };
    setStatistics(stats);
  };

  // Efeito para carregar as consultas quando o componente montar
  useEffect(() => {
    fetchConsultas();
  }, []);

  // Efeito para calcular o total de páginas sempre que filteredConsultas ou itemsPerPage mudar
  useEffect(() => {
    setTotalPages(Math.ceil(filteredConsultas.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredConsultas, itemsPerPage]);

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...consultas];
    
    // Filtrar por termo de busca (CPF ou nome)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.cpf.toLowerCase().includes(term) || 
        (c.nome && c.nome.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Filtrar por banco
    if (bancoFilter !== 'todos') {
      filtered = filtered.filter(c => c.banco === bancoFilter);
    }
    
    // Filtrar por intervalo de datas
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(c => new Date(c.created_at) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Configura para o final do dia
      filtered = filtered.filter(c => new Date(c.created_at) <= endDate);
    }
    
    setFilteredConsultas(filtered);
    calculateStatistics(filtered);
  };

  // Efeito para aplicar filtros quando os valores mudam
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, bancoFilter, dateRange]);

  // Função para resetar filtros
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setBancoFilter('todos');
    setDateRange({
      start: '',
      end: new Date().toISOString().split('T')[0]
    });
  };

  // Função para formatar CPF
  const formatCPF = (cpf: string): string => {
    if (!cpf) return '';
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) return cpf;
    return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar telefone
  const formatPhone = (phone: string): string => {
    if (!phone) return '';
    const phoneClean = phone.replace(/\D/g, '');
    
    if (phoneClean.length === 11) {
      return phoneClean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phoneClean.length === 10) {
      return phoneClean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  };

  // Exportar para CSV
  const exportToCSV = () => {
    if (filteredConsultas.length === 0) return;
    
    // Define cabeçalhos do CSV
    const headers = [
      'ID', 'Batch ID', 'Request ID', 'CPF', 'Nome', 'Telefone',
      'Status', 'Valor Liberado', 'Banco', 'Mensagem', 'Log', 'Data'
    ];
    
    // Preparar conteúdo do CSV
    let csvContent = headers.map(header => `"${header}"`).join(",") + "\n";
    
    filteredConsultas.forEach(consulta => {
      const row = [
        consulta.id,
        consulta.batch_id,
        consulta.request_id,
        formatCPF(consulta.cpf),
        consulta.nome || '',
        consulta.telefone || '',
        consulta.status,
        consulta.valor_liberado,
        consulta.banco || '',
        consulta.mensagem || '',
        consulta.log || '',
        formatDate(consulta.created_at)
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    // Criar blob e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_consultas_fgts_${new Date().toISOString().replace(/[:\.]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar status com ícones
  const renderStatus = (status: string) => {
    switch (status) {
      case 'com_saldo':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Com Saldo
          </span>
        );
      case 'sem_saldo':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            <XCircle className="h-4 w-4 mr-1" />
            Sem Saldo
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <AlertCircle className="h-5 w-5 mr-1" />
            Erro
          </span>
        );
    }
  };

  // Lista de bancos disponíveis
  const availableBanks = Array.from(new Set(consultas.map(c => c.banco).filter(Boolean)));

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Calculate the range of items to display based on pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const consultasToDisplay = filteredConsultas.slice(startIndex, endIndex);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-800">
            Histórico de Consultas
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
              onClick={fetchConsultas}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={exportToCSV}
              disabled={filteredConsultas.length === 0}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                filteredConsultas.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>
        </div>
        
        {/* Painel de filtros */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Filtrar Consultas</h3>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Limpar Filtros
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                >
                  <option value="todos">Todos</option>
                  <option value="com_saldo">Com Saldo</option>
                  <option value="sem_saldo">Sem Saldo</option>
                  <option value="erro">Erro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <select
                  value={bancoFilter}
                  onChange={(e) => setBancoFilter(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                >
                  <option value="todos">Todos</option>
                  {availableBanks.map((bank, index) => (
                    <option key={index} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar (CPF/Nome)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 pl-9 border"
                  placeholder="Buscar por CPF ou nome..."
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total de Consultas</div>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Com Saldo</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.comSaldo}
              <span className="text-sm text-gray-500 font-normal ml-1">
                ({statistics.total ? Math.round((statistics.comSaldo / statistics.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Sem Saldo</div>
            <div className="text-2xl font-bold text-gray-600">
              {statistics.semSaldo}
              <span className="text-sm text-gray-500 font-normal ml-1">
                ({statistics.total ? Math.round((statistics.semSaldo / statistics.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Com Erro</div>
            <div className="text-2xl font-bold text-red-600">
              {statistics.erro}
              <span className="text-sm text-gray-500 font-normal ml-1">
                ({statistics.total ? Math.round((statistics.erro / statistics.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Tabela de consultas */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando histórico de consultas...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredConsultas.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              Nenhuma consulta encontrada
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Não foram encontradas consultas com os filtros selecionados.
              Tente alterar os filtros ou realizar novas consultas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultasToDisplay.map((consulta, index) => (
                  <tr key={consulta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCPF(consulta.cpf)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {consulta.nome || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatPhone(consulta.telefone) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatus(consulta.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {consulta.valor_liberado ? `R$ ${consulta.valor_liberado}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {consulta.banco || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(consulta.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      <button 
                        onClick={() => {
                          setSelectedConsulta(consulta);
                          setShowDetails(true);
                        }}
                        className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando
                  <span className="font-medium">
                    {startIndex + 1}
                  </span>
                  a
                  <span className="font-medium">
                    {Math.min(endIndex, filteredConsultas.length)}
                  </span>
                  de
                  <span className="font-medium">
                    {filteredConsultas.length}
                  </span>
                  resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {/* Simple page number display - consider more advanced pagination for many pages */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {showDetails && selectedConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <FileJson className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">
                  Detalhes da Consulta: CPF {formatCPF(selectedConsulta.cpf)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedConsulta(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Informações Gerais</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs text-gray-500">ID:</div>
                      <div className="text-xs font-medium">{selectedConsulta.id}</div>
                      
                      <div className="text-xs text-gray-500">Request ID:</div>
                      <div className="text-xs font-medium">{selectedConsulta.request_id}</div>
                      
                      <div className="text-xs text-gray-500">Batch ID:</div>
                      <div className="text-xs font-medium">{selectedConsulta.batch_id}</div>
                      
                      <div className="text-xs text-gray-500">Data:</div>
                      <div className="text-xs font-medium">{formatDate(selectedConsulta.created_at)}</div>
                      
                      <div className="text-xs text-gray-500">Status:</div>
                      <div className="text-xs font-medium">{renderStatus(selectedConsulta.status)}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Dados do Cliente</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs text-gray-500">CPF:</div>
                      <div className="text-xs font-medium">{formatCPF(selectedConsulta.cpf)}</div>
                      
                      <div className="text-xs text-gray-500">Nome:</div>
                      <div className="text-xs font-medium">{selectedConsulta.nome || '-'}</div>
                      
                      <div className="text-xs text-gray-500">Telefone:</div>
                      <div className="text-xs font-medium">{formatPhone(selectedConsulta.telefone) || '-'}</div>
                      
                      <div className="text-xs text-gray-500">Valor Liberado:</div>
                      <div className="text-xs font-medium">{selectedConsulta.valor_liberado ? `R$ ${selectedConsulta.valor_liberado}` : '-'}</div>
                      
                      <div className="text-xs text-gray-500">Banco:</div>
                      <div className="text-xs font-medium">{selectedConsulta.banco || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Log</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-700">{selectedConsulta.log || 'Nenhum log disponível'}</p>
                </div>
              </div>
              
              {selectedConsulta.api_response && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resposta da API</h4>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-60">
                    {JSON.stringify(selectedConsulta.api_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedConsulta(null);
                }}
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

export default HistoricoConsultas;
