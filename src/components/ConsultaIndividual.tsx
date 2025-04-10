import React, { useState } from 'react';
    import { RefreshCw, ChevronUp, ChevronDown, Copy, Search, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

    const ConsultaIndividual: React.FC = () => {
      const [cpf, setCpf] = useState('');
      const [isConsulting, setIsConsulting] = useState(false);
      const [result, setResult] = useState<any>(null);
      const [showDetails, setShowDetails] = useState(false);
      const [error, setError] = useState<string | null>(null);
      
      // Função para formatar o CPF enquanto o usuário digita
      const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/\D/g, ''); // Remove caracteres não numéricos
        
        if (value.length <= 11) {
          // Aplica a máscara de CPF (XXX.XXX.XXX-XX)
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
          setCpf(value);
        }
      };
      
      // Consulta a API real
      const handleConsulta = async () => {
        if (cpf.length < 14) return; // Valida se o CPF está completo
        
        setIsConsulting(true);
        setError(null);
        
        try {
          // Preparando o CPF (removendo formatação)
          const cpfNumerico = cpf.replace(/\D/g, '');
          
          // Chamada à API de consulta
          const response = await fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf: cpfNumerico })
          });
          
          if (!response.ok) {
            throw new Error(`Erro na consulta: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          setResult(data);
          setIsConsulting(false);
          
        } catch (err: any) {
          console.error('Erro ao consultar o CPF:', err);
          setError(err.message || 'Ocorreu um erro ao consultar o CPF. Tente novamente mais tarde.');
          setIsConsulting(false);
        }
      };
      
      // Função para copiar o resultado para a área de transferência
      const handleCopy = () => {
        if (!result) return;
        
        const textToCopy = JSON.stringify(result, null, 2);
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          alert('Resultado copiado para a área de transferência');
        });
      };
      
      // Verifica se o cliente tem saldo disponível
      const clienteTemSaldoDisponivel = () => {
        return result && result.codigo === "SIM";
      };
      
      // Formata a data para o formato brasileiro
      const formatarData = (dataString: string) => {
        if (!dataString) return '';
        
        // Verifica se a data já está no formato brasileiro (DD/MM/YYYY)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
          return dataString;
        }
        
        // Caso contrário, converte de ISO para formato brasileiro
        try {
          const data = new Date(dataString);
          return data.toLocaleDateString('pt-BR');
        } catch (e) {
          return dataString; // Retorna a string original em caso de erro
        }
      };
      
      // Processa as parcelas para um formato uniforme
      const processarParcelas = () => {
        if (!result || !result.parcelasjson || !result.parcelasjson.length) {
          return [];
        }
        
        // Verifica se estamos lidando com o formato Pine/Facta (dataRepasse_X e valor_X)
        const primeiroItem = result.parcelasjson[0];
        const isPineFactaFormat = Object.keys(primeiroItem).some(key => 
          key.startsWith('dataRepasse_') || key.startsWith('valor_')
        );
        
        if (isPineFactaFormat) {
          // Formato Pine/Facta
          return result.parcelasjson.map((parcela: any, index: number) => {
            const numeroSequencial = index + 1;
            const dataKey = `dataRepasse_${numeroSequencial}`;
            const valorKey = `valor_${numeroSequencial}`;
            
            return {
              dueDate: parcela[dataKey] || '',
              amount: parcela[valorKey] ? parseFloat(parcela[valorKey].replace(',', '.')) : 0
            };
          }).filter((parcela: any) => parcela.dueDate && parcela.amount > 0);
        } else {
          // Formato padrão (dueDate e amount)
          return result.parcelasjson;
        }
      };
      
      // Renderiza o resultado com base na resposta real da API
      const renderResultado = () => {
        const temSaldo = clienteTemSaldoDisponivel();
        const parcelas = processarParcelas();
        
        return (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Resultado da Consulta</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  title="Copiar resultado"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  title={showDetails ? "Esconder detalhes" : "Mostrar detalhes"}
                >
                  {showDetails ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* CPF e informações básicas */}
              <div className="flex flex-col sm:flex-row justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-500">CPF Consultado</div>
                  <div className="text-lg font-medium">{cpf}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Data da Consulta</div>
                  <div className="text-lg font-medium">
                    {new Date().toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              
              {/* Exibe o saldo ou status da consulta */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Resultado da Consulta</div>
                    <div className="text-2xl font-bold text-green-600">
                      {temSaldo ? "Cliente com saldo disponível" : "Sem saldo disponível"}
                    </div>
                    {result && result.nome && (
                      <div className="text-sm text-gray-600 mt-1">
                        Nome: {result.nome}
                      </div>
                    )}
                    {temSaldo && result.valorliberado && (
                      <div className="text-md text-gray-800 mt-2">
                        Valor liberado: R$ {parseFloat(result.valorliberado).toFixed(2)}
                      </div>
                    )}
                    {temSaldo && result.banco && (
                      <div className="text-md text-gray-800 mt-1 font-semibold">
                        Banco: <span className="text-blue-600">{result.banco}</span>
                      </div>
                    )}
                  </div>
                  <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                    temSaldo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              {/* Cronograma de Parcelas */}
              {temSaldo && parcelas.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-md font-medium text-gray-700">
                      Cronograma de Parcelas
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data de Vencimento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor (R$)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parcelas.map((parcela: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatarData(parcela.dueDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {parcela.amount && typeof parcela.amount === 'number' 
                                ? parcela.amount.toFixed(2) 
                                : '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Detalhes completos da resposta da API */}
              {showDetails && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">
                    Resposta Completa da API
                  </h3>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-96 p-2 bg-gray-100 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      };
      
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Consulta Individual
              </h2>
              
              <div className="mb-4">
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                  CPF do Cliente
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="cpf"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-3 px-4 border"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleConsulta}
                disabled={cpf.length < 14 || isConsulting}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white ${
                  cpf.length < 14 || isConsulting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isConsulting ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Consultando...
                  </>
                ) : (
                  'Consultar Saldo FGTS'
                )}
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {error ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center text-red-600 mb-4">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <h3 className="text-lg font-medium">Erro na consulta</h3>
                </div>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Fechar
                </button>
              </div>
            ) : result ? (
              renderResultado()
            ) : (
              <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Nenhuma consulta realizada
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Digite um CPF válido e clique em "Consultar" para verificar o saldo disponível para saque FGTS.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    };

    export default ConsultaIndividual;
