import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, Search, Filter, Download } from 'lucide-react';

// Interface para os clientes com saldo
interface ClienteComSaldo {
  id: string;
  cpf: string;
  nome?: string;
  telefone?: string;
  valorLiberado: number;
  banco?: string;
  status: 'pendente' | 'enviado' | 'erro' | 'cancelado';
  mensagemStatus?: string;
  dataConsulta: string;
  dataEnvio?: string;
  apiResponse?: any;
}

// Interface para o estado de filtros
interface FiltrosState {
  status: 'todos' | 'pendente' | 'enviado' | 'erro' | 'cancelado';
  banco: string;
  valorMinimo: number;
  busca: string;
}

const DisparoWhatsApp: React.FC = () => {
  // Estado para armazenar a fila de clientes com saldo
  const [clientesComSaldo, setClientesComSaldo] = useState<ClienteComSaldo[]>([]);
  
  // Estado para armazenar os clientes filtrados
  const [clientesFiltrados, setClientesFiltrados] = useState<ClienteComSaldo[]>([]);
  
  // Estado para controlar o envio de mensagens
  const [enviandoMensagens, setEnviandoMensagens] = useState(false);
  
  // Estado para controlar o progresso do envio
  const [progressoEnvio, setProgressoEnvio] = useState(0);
  
  // Estado para armazenar os filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    status: 'todos',
    banco: '',
    valorMinimo: 0,
    busca: ''
  });
  
  // Estado para mostrar o painel de filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estado para armazenar as estatísticas
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    pendentes: 0,
    enviados: 0,
    erros: 0,
    cancelados: 0
  });
  
  // Estado para armazenar os bancos disponíveis
  const [bancosDisponiveis, setBancosDisponiveis] = useState<string[]>([]);
  
  // Efeito para carregar os clientes com saldo do localStorage
  useEffect(() => {
    const carregarClientesComSaldo = () => {
      try {
        // Tenta carregar os clientes do localStorage
        const clientesArmazenados = localStorage.getItem('clientesComSaldoFGTS');
        
        if (clientesArmazenados) {
          const clientes = JSON.parse(clientesArmazenados) as ClienteComSaldo[];
          setClientesComSaldo(clientes);
          setClientesFiltrados(clientes);
          
          // Atualiza as estatísticas
          atualizarEstatisticas(clientes);
          
          // Extrai os bancos disponíveis
          const bancos = [...new Set(clientes.map(c => c.banco || '').filter(b => b))];
          setBancosDisponiveis(bancos);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes do localStorage:', error);
      }
    };
    
    carregarClientesComSaldo();
  }, []);
  
  // Função para atualizar as estatísticas
  const atualizarEstatisticas = (clientes: ClienteComSaldo[]) => {
    const stats = {
      total: clientes.length,
      pendentes: clientes.filter(c => c.status === 'pendente').length,
      enviados: clientes.filter(c => c.status === 'enviado').length,
      erros: clientes.filter(c => c.status === 'erro').length,
      cancelados: clientes.filter(c => c.status === 'cancelado').length
    };
    
    setEstatisticas(stats);
  };
  
  // Efeito para aplicar os filtros quando eles mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, clientesComSaldo]);
  
  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    let clientesFiltrados = [...clientesComSaldo];
    
    // Filtro por status
    if (filtros.status !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter(c => c.status === filtros.status);
    }
    
    // Filtro por banco
    if (filtros.banco) {
      clientesFiltrados = clientesFiltrados.filter(c => c.banco === filtros.banco);
    }
    
    // Filtro por valor mínimo
    if (filtros.valorMinimo > 0) {
      clientesFiltrados = clientesFiltrados.filter(c => c.valorLiberado >= filtros.valorMinimo);
    }
    
    // Filtro por busca (CPF ou nome)
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase();
      clientesFiltrados = clientesFiltrados.filter(c => 
        c.cpf.includes(termoBusca) || 
        (c.nome && c.nome.toLowerCase().includes(termoBusca))
      );
    }
    
    setClientesFiltrados(clientesFiltrados);
  };
  
  // Função para limpar os filtros
  const limparFiltros = () => {
    setFiltros({
      status: 'todos',
      banco: '',
      valorMinimo: 0,
      busca: ''
    });
  };
  
  // Função para simular o envio de mensagens WhatsApp
  const enviarMensagens = async () => {
    // Filtra apenas os clientes pendentes
    const clientesPendentes = clientesComSaldo.filter(c => c.status === 'pendente');
    
    if (clientesPendentes.length === 0) {
      alert('Não há mensagens pendentes para enviar.');
      return;
    }
    
    setEnviandoMensagens(true);
    setProgressoEnvio(0);
    
    // Simula o envio de mensagens com um atraso de 1 segundo entre cada
    for (let i = 0; i < clientesPendentes.length; i++) {
      const cliente = clientesPendentes[i];
      
      // Atualiza o progresso
      setProgressoEnvio(Math.round(((i + 1) / clientesPendentes.length) * 100));
      
      try {
        // Simula uma chamada de API para enviar a mensagem
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simula um sucesso ou erro aleatório (80% de chance de sucesso)
        const sucesso = Math.random() > 0.2;
        
        // Atualiza o status do cliente
        atualizarStatusCliente(
          cliente.id, 
          sucesso ? 'enviado' : 'erro',
          sucesso ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem'
        );
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        atualizarStatusCliente(
          cliente.id, 
          'erro',
          'Erro ao enviar mensagem'
        );
      }
    }
    
    setEnviandoMensagens(false);
  };
  
  // Função para atualizar o status de um cliente
  const atualizarStatusCliente = (id: string, novoStatus: ClienteComSaldo['status'], mensagem?: string) => {
    const clientesAtualizados = clientesComSaldo.map(cliente => {
      if (cliente.id === id) {
        return {
          ...cliente,
          status: novoStatus,
          mensagemStatus: mensagem,
          dataEnvio: novoStatus === 'enviado' ? new Date().toISOString() : cliente.dataEnvio
        };
      }
      return cliente;
    });
    
    setClientesComSaldo(clientesAtualizados);
    
    // Atualiza o localStorage
    localStorage.setItem('clientesComSaldoFGTS', JSON.stringify(clientesAtualizados));
    
    // Atualiza as estatísticas
    atualizarEstatisticas(clientesAtualizados);
  };
  
  // Função para cancelar o envio de uma mensagem
  const cancelarEnvio = (id: string) => {
    atualizarStatusCliente(id, 'cancelado', 'Envio cancelado pelo usuário');
  };
  
  // Função para reenviar uma mensagem
  const reenviarMensagem = (id: string) => {
    atualizarStatusCliente(id, 'pendente', 'Aguardando reenvio');
  };
  
  // Função para baixar a lista de clientes em CSV
  const baixarListaCSV = () => {
    if (clientesFiltrados.length === 0) return;
    
    // Define os cabeçalhos do CSV
    const headers = [
      'ID', 'CPF', 'Nome', 'Telefone', 'Valor Liberado', 
      'Banco', 'Status', 'Mensagem', 'Data Consulta', 'Data Envio'
    ];
    
    // Prepara o conteúdo do CSV
    let csvContent = headers.map(header => `"${header}"`).join(",") + "\n";
    
    clientesFiltrados.forEach(cliente => {
      const row = [
        cliente.id,
        cliente.cpf,
        cliente.nome || '',
        cliente.telefone || '',
        cliente.valorLiberado.toFixed(2),
        cliente.banco || '',
        cliente.status,
        cliente.mensagemStatus || '',
        cliente.dataConsulta,
        cliente.dataEnvio || ''
      ].map(value => `"${value}"`).join(",");
      
      csvContent += row + "\n";
    });
    
    // Cria um blob e inicia o download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `disparo_whatsapp_fgts_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Função para formatar o CPF
  const formatarCPF = (cpf: string): string => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  
  // Função para formatar o telefone
  const formatarTelefone = (telefone?: string): string => {
    if (!telefone) return '-';
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    
    if (telefoneLimpo.length === 11) {
      return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telefoneLimpo.length === 10) {
      return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  };
  
  // Função para formatar a data
  const formatarData = (dataString?: string): string => {
    if (!dataString) return '-';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR');
    } catch (e) {
      return dataString;
    }
  };
  
  // Renderiza o ícone de status
  const renderIconeStatus = (status: ClienteComSaldo['status']) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'enviado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };
  
  // Renderiza o texto de status
  const renderTextoStatus = (status: ClienteComSaldo['status']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'enviado':
        return 'Enviado';
      case 'erro':
        return 'Erro';
      case 'cancelado':
        return 'Cancelado';
      default:
        return '';
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-800">
            Disparo de Mensagens WhatsApp
          </h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </button>
            
            <button
              onClick={baixarListaCSV}
              disabled={clientesFiltrados.length === 0}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                clientesFiltrados.length === 0
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
        {mostrarFiltros && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Filtrar Mensagens</h3>
              <button
                onClick={limparFiltros}
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
                  value={filtros.status}
                  onChange={(e) => setFiltros({...filtros, status: e.target.value as any})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="enviado">Enviados</option>
                  <option value="erro">Com Erro</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <select
                  value={filtros.banco}
                  onChange={(e) => setFiltros({...filtros, banco: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  {bancosDisponiveis.map((banco, index) => (
                    <option key={index} value={banco}>{banco}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Valor Mínimo
                </label>
                <input
                  type="number"
                  value={filtros.valorMinimo}
                  onChange={(e) => setFiltros({...filtros, valorMinimo: parseFloat(e.target.value) || 0})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="0"
                  step="100"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Buscar (CPF/Nome)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filtros.busca}
                    onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pl-8"
                    placeholder="Buscar..."
                  />
                  <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Resumo das estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Pendentes</div>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.pendentes}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Enviados</div>
            <div className="text-2xl font-bold text-green-600">{estatisticas.enviados}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Erros</div>
            <div className="text-2xl font-bold text-red-600">{estatisticas.erros}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Cancelados</div>
            <div className="text-2xl font-bold text-gray-600">{estatisticas.cancelados}</div>
          </div>
        </div>
        
        {/* Botão de enviar mensagens */}
        <div className="mb-6">
          <button
            onClick={enviarMensagens}
            disabled={enviandoMensagens || estatisticas.pendentes === 0}
            className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${
              enviandoMensagens || estatisticas.pendentes === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {enviandoMensagens ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Enviando Mensagens... ({progressoEnvio}%)
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagens ({estatisticas.pendentes})
              </>
            )}
          </button>
        </div>
        
        {/* Barra de progresso */}
        {enviandoMensagens && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressoEnvio}%` }}
              >
              </div>
            </div>
          </div>
        )}
        
        {/* Tabela de clientes */}
        {clientesFiltrados.length > 0 ? (
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
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Envio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente, index) => (
                  <tr key={cliente.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatarCPF(cliente.cpf)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {cliente.nome || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatarTelefone(cliente.telefone)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      R$ {cliente.valorLiberado.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {cliente.banco || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderIconeStatus(cliente.status)}
                        <span className={`ml-1.5 text-sm ${
                          cliente.status === 'enviado' ? 'text-green-600' :
                          cliente.status === 'erro' ? 'text-red-600' :
                          cliente.status === 'pendente' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {renderTextoStatus(cliente.status)}
                        </span>
                      </div>
                      {cliente.mensagemStatus && (
                        <div className="text-xs text-gray-500 mt-1">
                          {cliente.mensagemStatus}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatarData(cliente.dataEnvio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex space-x-2">
                        {cliente.status === 'pendente' && (
                          <button
                            onClick={() => cancelarEnvio(cliente.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Cancelar envio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        
                        {(cliente.status === 'erro' || cliente.status === 'cancelado') && (
                          <button
                            onClick={() => reenviarMensagem(cliente.id)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Tentar novamente"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        
                        {cliente.status === 'enviado' && (
                          <span className="text-green-500">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              Nenhuma mensagem na fila
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Não há clientes com saldo disponível para envio de mensagens WhatsApp.
              Realize uma consulta em lote para adicionar clientes à fila.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};<boltAction type="file" filePath="src/App.tsx">import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ConsultaIndividual from './components/ConsultaIndividual';
import ConsultaLote from './components/ConsultaLote';
import DisparoWhatsApp from './components/DisparoWhatsApp';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="consulta" element={<ConsultaIndividual />} />
          <Route path="consulta-lote" element={<ConsultaLote />} />
          <Route path="disparo-whatsapp" element={<DisparoWhatsApp />} />
          {/* Add more routes for other features here */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
