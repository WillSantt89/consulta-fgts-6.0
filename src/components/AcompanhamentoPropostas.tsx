import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  FileText, 
  RefreshCw, 
  Download, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Eye
} from 'lucide-react';

interface Proposta {
  id: number;
  cliente: string;
  cpf: string;
  banco: string;
  valor: number;
  status: 'pendente' | 'aprovada' | 'negada' | 'em_analise';
  dataEnvio: string;
  dataSituacao?: string;
}

const AcompanhamentoPropostas: React.FC = () => {
  // Estados principais
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [filteredPropostas, setFilteredPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [bancoFilter, setBancoFilter] = useState<string>('todos');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '', 
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Estatísticas
  const [statistics, setStatistics] = useState({
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    negadas: 0,
    emAnalise: 0
  });
  
  // Carregar propostas (simulado)
  const fetchPropostas = () => {
    setLoading(true);
    setError(null);
    
    // Simulação de dados (substitua por uma chamada real à API)
    setTimeout(() => {
      try {
        const mockPropostas: Proposta[] = [
          {
            id: 1,
            cliente: 'Maria Silva Santos',
            cpf: '123.456.789-00',
            banco: 'FACTA',
            valor: 5000,
            status: 'aprovada',
            dataEnvio: '2023-11-10T14:30:00',
            dataSituacao: '2023-11-12T09:15:00'
          },
          {
            id: 2,
            cliente: 'João Pereira Alves',
            cpf: '987.654.321-00',
            banco: 'VCTEX',
            valor: 3500,
            status: 'pendente',
            dataEnvio: '2023-11-15T10:20:00'
          },
          {
            id: 3,
            cliente: 'Ana Beatriz Costa',
            cpf: '456.789.123-00',
            banco: 'BMG',
            valor: 7200,
            status: 'em_analise',
            dataEnvio: '2023-11-14T16:45:00'
          },
          {
            id: 4,
            cliente: 'Carlos Eduardo Oliveira',
            cpf: '789.123.456-00',
            banco: 'MERCANTIL',
            valor: 10000,
            status: 'negada',
            dataEnvio: '2023-11-08T11:30:00',
            dataSituacao: '2023-11-11T14:20:00'
          },
          {
            id: 5,
            cliente: 'Fernanda Lima Castro',
            cpf: '321.654.987-00',
            banco: 'ICRED',
            valor: 4500,
            status: 'aprovada',
            dataEnvio: '2023-11-05T09:15:00',
            dataSituacao: '2023-11-07T16:30:00'
          }
        ];
        
        setPropostas(mockPropostas);
        setFilteredPropostas(mockPropostas);
        calculateStatistics(mockPropostas);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar propostas:', err);
        setError('Ocorreu um erro ao carregar as propostas. Tente novamente mais tarde.');
        setLoading(false);
      }
    }, 1000);
  };
  
  // Efeito para buscar propostas na montagem do componente
  useEffect(() => {
    fetchPropostas();
  }, []);
  
  // Efeito para calcular o total de páginas
  useEffect(() => {
    setTotalPages(Math.ceil(filteredPropostas.length / itemsPerPage));
    // Reset para a primeira página quando os filtros mudam
    setCurrentPage(1);
  }, [filteredPropostas, itemsPerPage]);
  
  // Efeito para aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, bancoFilter, dateRange, propostas]);
  
  // Calcular estatísticas
  const calculateStatistics = (data: Proposta[]) => {
    const stats = {
      total: data.length,
      pendentes: data.filter(p => p.status === 'pendente').length,
      aprovadas: data.filter(p => p.status === 'aprovada').length,
      negadas: data.filter(p => p.status === 'negada').length,
      emAnalise: data.filter(p => p.status === 'em_analise').length
    };
    setStatistics(stats);
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...propostas];
    
    // Filtro por termo de busca (cliente ou CPF)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.cliente.toLowerCase().includes(term) || 
        p.cpf.toLowerCase().includes(term)
      );
    }
    
    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Filtro por banco
    if (bancoFilter !== 'todos') {
      filtered = filtered.filter(p => p.banco === bancoFilter);
    }
    
    // Filtro por intervalo de datas
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(p => {
        const propostaDate = new Date(p.dataEnvio);
        return propostaDate >= startDate;
      });
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(p => {
        const propostaDate = new Date(p.dataEnvio);
        return propostaDate <= endDate;
      });
    }
    
    setFilteredPropostas(filtered);
    calculateStatistics(filtered);
  };
  
  // Resetar filtros
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setBancoFilter('todos');
    setDateRange({
      start: '',
      end: new Date().toISOString().split('T')[0]
    });
  };
  
  // Formatar CPF
  const formatCPF = (cpf: string): string => {
    return cpf;
  };
  
  // Formatar data
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };
  
  // Formatar valor monetário
  const formatMoney = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Renderizar o status com cores e ícones
  const renderStatus = (status: string) => {
    switch (status) {
      case 'aprovada':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Aprovada
          </span>
        );
      case 'negada':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Negada
          </span>
        );
      case 'pendente':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Pendente
          </span>
        );
      case 'em_analise':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <RefreshCw className="h-4 w-4 mr-1" />
            Em Análise
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };
  
  // Exportar para CSV
  const exportToCSV = () => {
    if (filteredPropostas.length === 0) return;
    
    // Define cabeçalhos do CSV
    const headers = [
      'ID', 'Cliente', 'CPF', 'Banco', 'Valor', 'Status', 'Data de Envio', 'Data de Situação'
    ];
    
    // Preparar conteúdo do CSV
    let csvContent = headers.map(header => `"${header}"`).join(",") + "\n";
    
    filteredPropostas.forEach(proposta => {
      const row = [
        proposta.id,
        proposta.cliente,
        proposta.cpf,
        proposta.banco,
        proposta.valor.toFixed(2),
        proposta.status,
        proposta.dataEnvio,
        proposta.dataSituacao || ''
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    // Criar blob e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    link.setAttribute('download', `propostas_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Mudar de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  // Lista de bancos disponíveis
  const availableBanks = ['FACTA', 'VCTEX', 'ICRED', 'BMG', 'MERCANTIL'];
  
  // Calcular os itens a exibir com base na página atual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPropostas.length);
  const propostasToDisplay = filteredPropostas.slice(startIndex, endIndex);
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-800">
            Acompanhamento de Propostas
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
              onClick={fetchPropostas}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={exportToCSV}
              disabled={filteredPropostas.length === 0}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                filteredPropostas.length === 0
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
              <h3 className="text-sm font-medium text-gray-700">Filtrar Propostas</h3>
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
                  <option value="pendente">Pendente</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="negada">Negada</option>
                  <option value="em_analise">Em Análise</option>
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
                Buscar (Cliente/CPF)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 pl-9 border"
                  placeholder="Buscar por nome do cliente ou CPF..."
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total de Propostas</div>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.pendentes}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Aprovadas</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.aprovadas}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Negadas</div>
            <div className="text-2xl font-bold text-red-600">
              {statistics.negadas}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Em Análise</div>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.emAnalise}
            </div>
          </div>
        </div>

        {/* Tabela de propostas */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando propostas...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredPropostas.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              Nenhuma proposta encontrada
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Não foram encontradas propostas com os filtros selecionados.
              Tente alterar os filtros ou cadastrar novas propostas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Envio
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {propostasToDisplay.map((proposta, index) => (
                  <tr key={proposta.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {proposta.cliente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {proposta.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {proposta.banco}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatMoney(proposta.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatus(proposta.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(proposta.dataEnvio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {proposta.status === 'pendente' && (
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            title="Editar proposta"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
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
                  <span className="font-medium">{filteredPropostas.length}</span> resultados
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
                    <ChevronDown className="h-5 w-5 rotate-90" aria-hidden="true" />
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
                    <ChevronDown className="h-5 w-5 -rotate-90" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcompanhamentoPropostas;
