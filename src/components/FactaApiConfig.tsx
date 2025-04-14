import React, { useState, useEffect } from 'react';
import { 
  Save,
  KeyRound,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Clock
} from 'lucide-react';

interface ApiCredentials {
  usuario: string;
  senha: string;
  ambiente: 'homologacao' | 'producao';
}

interface TokenResponse {
  erro: boolean;
  mensagem: string;
  token: string;
  expira: string;
  expirationTimestamp?: number;
}

const FactaApiConfig: React.FC = () => {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    usuario: '',
    senha: '',
    ambiente: 'homologacao'
  });
  
  const [savedCredentials, setSavedCredentials] = useState<ApiCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Carregar credenciais salvas
  useEffect(() => {
    const loadCredentials = () => {
      setIsLoading(true);
      try {
        const savedData = localStorage.getItem('factaApiCredentials');
        if (savedData) {
          const parsed = JSON.parse(savedData) as ApiCredentials;
          setSavedCredentials(parsed);
          setCredentials(parsed);
        }
        
        // Carregar token se existir e estiver válido
        const savedToken = localStorage.getItem('factaApiToken');
        if (savedToken) {
          const parsedToken = JSON.parse(savedToken) as TokenResponse;
          
          // Verificar se o token ainda é válido (não expirou)
          if (parsedToken.expirationTimestamp && parsedToken.expirationTimestamp > Date.now()) {
            setToken(parsedToken);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCredentials();
  }, []);
  
  // Atualizar o tempo restante do token a cada segundo
  useEffect(() => {
    if (!token || !token.expirationTimestamp) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = token.expirationTimestamp! - now;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setToken(null);
        localStorage.removeItem('factaApiToken');
        setTimeRemaining('Expirado');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}m ${seconds}s`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [token]);
  
  // Função para salvar as credenciais
  const saveCredentials = async () => {
    // Validar campos
    if (!credentials.usuario || !credentials.senha) {
      setErrorMessage('Por favor, preencha o usuário e senha.');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Salvar no localStorage (em produção, seria uma API)
      localStorage.setItem('factaApiCredentials', JSON.stringify(credentials));
      setSavedCredentials(credentials);
      setSuccessMessage('Credenciais salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      setErrorMessage('Erro ao salvar as credenciais. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Função para codificar em Base64
  const encodeBase64 = (str: string): string => {
    return btoa(str);
  };
  
  // Função para gerar token
  const generateToken = async () => {
    // Verificar se existem credenciais
    if (!savedCredentials) {
      setErrorMessage('Salve suas credenciais antes de gerar um token.');
      return;
    }
    
    setIsGeneratingToken(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const baseUrl = savedCredentials.ambiente === 'homologacao' 
        ? 'https://webservice-homol.facta.com.br/gera-token'
        : 'https://webservice.facta.com.br/gera-token';
      
      const authString = `${savedCredentials.usuario}:${savedCredentials.senha}`;
      const encodedAuth = encodeBase64(authString);
      
      // Em ambiente real, a chamada seria feita para a API externa
      // Para este exercício, simularemos a resposta
      // const response = await fetch(baseUrl, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Basic ${encodedAuth}`
      //   }
      // });
      // const data = await response.json();
      
      // Simulando resposta
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calcular data de expiração (1 hora a partir de agora)
      const now = new Date();
      const expirationDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora
      const expirationFormatted = expirationDate.toLocaleDateString('pt-BR') + ' ' + 
        expirationDate.toLocaleTimeString('pt-BR');
      
      const mockResponse: TokenResponse = {
        erro: false,
        mensagem: "Token gerado com sucesso",
        token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyNDUiLCJsdmwiOiIyIiwidXNyIjoiMTAyNCIsImNydCI6IjEwMjQiLCJpYXQiOjE3MTI5NDgxMjksImV4cCI6MTcxMjk1MTcyOX0.gfJZcSQRo4hpPHhR2D3SJEtNBPJE4mrjP6kXsf2rjs",
        expira: expirationFormatted,
        expirationTimestamp: expirationDate.getTime()
      };
      
      setToken(mockResponse);
      localStorage.setItem('factaApiToken', JSON.stringify(mockResponse));
      setSuccessMessage('Token gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      setErrorMessage('Erro ao gerar o token. Verifique suas credenciais e tente novamente.');
    } finally {
      setIsGeneratingToken(false);
    }
  };
  
  // Função para copiar o token para a área de transferência
  const copyToken = () => {
    if (!token) return;
    
    navigator.clipboard.writeText(token.token).then(() => {
      alert('Token copiado para a área de transferência!');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-800">Cadastro de API Facta</h2>
          <div className="flex items-center text-sm text-gray-500">
            <KeyRound className="w-4 h-4 mr-1" />
            Configurações de Acesso
          </div>
        </div>
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <div className="mb-8">
          <div className="bg-blue-50 p-4 rounded-md text-blue-700 mb-6">
            <p className="text-sm">
              <strong>Instruções:</strong> Insira as credenciais fornecidas pela Facta para integração via API.
              O token gerado tem validade de 1 hora e pode ser utilizado em múltiplas requisições durante esse período.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-1">
                Usuário <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="usuario"
                value={credentials.usuario}
                onChange={(e) => setCredentials({...credentials, usuario: e.target.value})}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Usuário fornecido pela Facta"
                required
              />
            </div>
            
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  value={credentials.senha}
                  onChange={(e) => setCredentials({...credentials, senha: e.target.value})}
                  className="block w-full py-2 px-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Senha fornecida pela Facta"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="ambiente" className="block text-sm font-medium text-gray-700 mb-1">
                Ambiente <span className="text-red-500">*</span>
              </label>
              <select
                id="ambiente"
                value={credentials.ambiente}
                onChange={(e) => setCredentials({...credentials, ambiente: e.target.value as 'homologacao' | 'producao'})}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="homologacao">Homologação</option>
                <option value="producao">Produção</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={saveCredentials}
                disabled={isSaving}
                className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Credenciais
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Gerenciamento de Token</h3>
          
          {token ? (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-700">Token Ativo</h4>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Expira em: {timeRemaining}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gray-100 p-3 rounded border border-gray-200 text-xs font-mono text-gray-800 break-all">
                  {token.token}
                </div>
                <button
                  type="button"
                  onClick={copyToken}
                  className="absolute top-2 right-2 p-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                  title="Copiar token"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                <p>Data de expiração: {token.expira}</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 mb-4 text-sm">
              <p>Nenhum token ativo no momento. Gere um novo token para realizar operações com a API Facta.</p>
            </div>
          )}
          
          <button
            type="button"
            onClick={generateToken}
            disabled={isGeneratingToken || !savedCredentials}
            className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isGeneratingToken || !savedCredentials ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isGeneratingToken ? (
              <>
                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                Gerando Token...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                {token ? 'Renovar Token' : 'Gerar Novo Token'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactaApiConfig;
