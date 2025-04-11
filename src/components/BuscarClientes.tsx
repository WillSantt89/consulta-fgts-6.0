import React, { useState } from 'react';
    import { Search, AlertCircle, RefreshCw, User, Clipboard, Phone, Mail } from 'lucide-react';

    const BuscarClientes: React.FC = () => {
      const [cpf, setCpf] = useState('');
      const [isSearching, setIsSearching] = useState(false);
      const [clientData, setClientData] = useState<any>(null);
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
      
      // Consulta a API 
      const handleSearch = async () => {
        if (cpf.length < 14) {
          setError('CPF inválido. Digite um CPF completo.');
          return;
        }
        
        setIsSearching(true);
        setError(null);
        setClientData(null);
        
        try {
          // Preparando o CPF (removendo formatação)
          const cpfNumerico = cpf.replace(/\D/g, '');
          
          // Chamada à API de consulta
          const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/consultacpf', {
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
          setClientData(data);
          
          if (!data || Object.keys(data).length === 0) {
            setError('Cliente não encontrado na base de dados.');
          }
          
        } catch (err: any) {
          console.error('Erro ao consultar o CPF:', err);
          setError(err.message || 'Ocorreu um erro ao consultar o CPF. Tente novamente mais tarde.');
        } finally {
          setIsSearching(false);
        }
      };
      
      // Formatar o telefone
      const formatPhone = (phone: string | undefined) => {
        if (!phone) return '';
        
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
          return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (digits.length === 10) {
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
      };
      
      // Formatar CPF
      const formatCpf = (cpfValue: string | undefined) => {
        if (!cpfValue) return '';
        
        const digits = cpfValue.replace(/\D/g, '');
        if (digits.length === 11) {
          return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpfValue;
      };
      
      // Formatar data
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('pt-BR');
        } catch (e) {
          return dateString;
        }
      };
      
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Buscar Cliente
            </h2>
            
            <div className="mb-8">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                    CPF do Cliente
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    value={cpf}
                    onChange={handleCpfChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="000.000.000-00"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || cpf.length < 14}
                  className={`px-4 py-2 flex items-center justify-center rounded-md ${
                    isSearching || cpf.length < 14
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Consultar
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
            
            {clientData && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-medium text-gray-800">{clientData.nome || 'Nome não informado'}</h3>
                    <div className="flex items-center text-gray-500">
                      <Clipboard className="h-4 w-4 mr-1" />
                      <span>{formatCpf(clientData.cpf)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Informações de Contato</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{formatPhone(clientData.telefone) || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{clientData.email || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Endereço</h4>
                    <address className="not-italic text-sm text-gray-600">
                      {clientData.endereco ? (
                        <>
                          {clientData.endereco}<br />
                          {clientData.cidade && clientData.estado && `${clientData.cidade} - ${clientData.estado}`}<br />
                          {clientData.cep && `CEP: ${clientData.cep}`}
                        </>
                      ) : (
                        'Endereço não informado'
                      )}
                    </address>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Informações Adicionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Data de Nascimento</div>
                      <div className="font-medium">{formatDate(clientData.dataNascimento) || 'Não informada'}</div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className={`font-medium ${
                        clientData.status === 'ativo' ? 'text-green-600' : 
                        clientData.status === 'inativo' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {clientData.status ? (clientData.status.charAt(0).toUpperCase() + clientData.status.slice(1)) : 'Não informado'}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Cliente desde</div>
                      <div className="font-medium">{formatDate(clientData.createdAt) || 'Não informado'}</div>
                    </div>
                  </div>
                </div>
                
                {clientData.observacoes && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Observações</h4>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-sm text-gray-600">{clientData.observacoes}</p>
                    </div>
                  </div>
                )}
                
                {/* Mostra o objeto completo para debug */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <details className="text-xs">
                    <summary className="text-gray-500 cursor-pointer">Dados completos (Debug)</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto max-h-96">
                      {JSON.stringify(clientData, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    export default BuscarClientes;
