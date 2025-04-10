import React, { useState } from 'react';
import { Upload, RefreshCw, FileText, AlertCircle, CheckCircle, XCircle, Download } from 'lucide-react';

const ConsultaLote: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Função para lidar com o upload do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  // Função para validar o arquivo
  const validateFile = (file: File): boolean => {
    // Verifica se é um arquivo CSV ou Excel
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Formato de arquivo inválido. Por favor, envie um arquivo CSV ou Excel.');
      return false;
    }
    
    // Verifica o tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
      return false;
    }
    
    return true;
  };
  
  // Função para processar o arquivo
  const processFile = async () => {
    if (!file) return;
    
    if (!validateFile(file)) return;
    
    setIsUploading(true);
    setError(null);
    
    // Simulação de upload
    setTimeout(() => {
      setIsUploading(false);
      setIsProcessing(true);
      
      // Simulação de processamento
      setTimeout(() => {
        setIsProcessing(false);
        
        // Dados de exemplo para simulação
        setResults({
          total: 100,
          comSaldo: 64,
          semSaldo: 28,
          erros: 8,
          detalhes: [
            { cpf: '123.456.789-00', nome: 'João Silva', status: 'com_saldo', valorLiberado: 3500.00 },
            { cpf: '987.654.321-00', nome: 'Maria Oliveira', status: 'sem_saldo', valorLiberado: 0 },
            { cpf: '111.222.333-44', nome: 'Pedro Santos', status: 'com_saldo', valorLiberado: 2800.00 },
            { cpf: '555.666.777-88', nome: 'Ana Souza', status: 'erro', mensagem: 'CPF não encontrado' },
            { cpf: '999.888.777-66', nome: 'Carlos Ferreira', status: 'com_saldo', valorLiberado: 4200.00 }
          ]
        });
      }, 2000);
    }, 1500);
  };
  
  // Função para baixar os resultados
  const downloadResults = () => {
    if (!results) return;
    
    // Criando conteúdo CSV
    let csvContent = "CPF,Nome,Status,Valor Liberado\n";
    
    results.detalhes.forEach((item: any) => {
      const status = item.status === 'com_saldo' ? 'Com Saldo' : 
                    item.status === 'sem_saldo' ? 'Sem Saldo' : 'Erro';
      const valor = item.valorLiberado ? item.valorLiberado.toFixed(2) : '0.00';
      csvContent += `${item.cpf},"${item.nome}",${status},${valor}\n`;
    });
    
    // Criando o blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'resultados_consulta_fgts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Renderiza o resultado do processamento
  const renderResults = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Resultados da Consulta em Lote</h2>
          <button 
            onClick={downloadResults}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar Resultados
          </button>
        </div>
        
        <div className="p-6">
          {/* Resumo dos resultados */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total de CPFs</div>
              <div className="text-2xl font-bold">{results.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Com Saldo</div>
              <div className="text-2xl font-bold text-green-600">{results.comSaldo} ({Math.round(results.comSaldo / results.total * 100)}%)</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Sem Saldo</div>
              <div className="text-2xl font-bold text-gray-600">{results.semSaldo} ({Math.round(results.semSaldo / results.total * 100)}%)</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Erros</div>
              <div className="text-2xl font-bold text-red-600">{results.erros} ({Math.round(results.erros / results.total * 100)}%)</div>
            </div>
          </div>
          
          {/* Tabela de resultados */}
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
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Liberado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.detalhes.map((item: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'com_saldo' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Com Saldo
                        </span>
                      )}
                      {item.status === 'sem_saldo' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          <XCircle className="h-4 w-4 mr-1" />
                          Sem Saldo
                        </span>
                      )}
                      {item.status === 'erro' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Erro
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.valorLiberado ? `R$ ${item.valorLiberado.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Consulta em Lote
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Faça o upload de um arquivo CSV ou Excel contendo uma lista de CPFs para consulta em lote.
            O arquivo deve conter uma coluna com o título "CPF" contendo os números de CPF a serem consultados.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              className="hidden"
              accept=".csv,.xlsx,.xls"
            />
            
            <div className="flex flex-col items-center justify-center">
              <Upload className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste e solte seu arquivo aqui, ou
              </p>
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
              >
                Selecionar Arquivo
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formatos suportados: CSV, Excel (.xlsx, .xls) - Máx. 5MB
              </p>
            </div>
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={processFile}
          disabled={!file || isUploading || isProcessing}
          className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white ${
            !file || isUploading || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Enviando arquivo...
            </>
          ) : isProcessing ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Processando consultas...
            </>
          ) : (
            'Iniciar Consulta em Lote'
          )}
        </button>
      </div>
      
      {results && renderResults()}
    </div>
  );
};

export default ConsultaLote;
