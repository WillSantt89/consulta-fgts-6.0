import React, { useState, useRef } from 'react';
import { Upload, RefreshCw, FileText, AlertCircle, CheckCircle, XCircle, Download, Info, X, FileJson } from 'lucide-react';
import Papa from 'papaparse';

interface ProcessedResult {
  id: string;
  cpf: string;
  nome?: string;
  telefone?: string;
  status: 'com_saldo' | 'sem_saldo' | 'erro' | 'pendente';
  valorLiberado?: number;
  banco?: string;
  mensagem?: string;
  log?: string;
  apiResponse?: any; // Armazenar a resposta completa da API
}

interface ResultsSummary {
  total: number;
  comSaldo: number;
  semSaldo: number;
  erros: number;
  pendentes: number;
  detalhes: ProcessedResult[];
}

const ConsultaLote: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [results, setResults] = useState<ResultsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<{cpf: string, response: any} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para gerar um ID único
  const generateUniqueId = (index: number): string => {
    const timestamp = new Date().getTime();
    return `REQ${timestamp}${index.toString().padStart(4, '0')}`;
  };

  // Função para lidar com o upload do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setValidationErrors([]);

      // Analisa o arquivo
      parseFile(selectedFile);
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

  // Função para formatar o CPF
  const formatarCPF = (cpf: string): string => {
    // Remove caracteres não numéricos
    const cpfNumerico = cpf.replace(/\D/g, '');

    // Completa com zeros à esquerda se for menor que 11 dígitos
    const cpfPreenchido = cpfNumerico.padStart(11, '0');

    return cpfPreenchido;
  };

  // Função para analisar o arquivo CSV
  const parseFile = (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setError(null);

    // Por enquanto, só processamos arquivos CSV
    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsUploading(false);

          // Verificar se o CSV tem a coluna CPF
          const headers = results.meta.fields || [];

          if (!headers.some(header =>
            header === 'CPF' || header === 'cpf' ||
            header === 'Cpf' || header === 'CPF_CLIENTE'
          )) {
            setError('O arquivo CSV não possui uma coluna de CPF. Por favor, verifique o formato do arquivo.');
            return;
          }

          // Validar o conteúdo do CSV
          const errors: string[] = [];
          const validatedData = results.data.map((row: any, index: number) => {
            // Adicionar ID único para cada registro
            const id = row.ID || generateUniqueId(index);

            // Encontrar a coluna de CPF
            const cpfColumn = Object.keys(row).find(key =>
              key === 'CPF' || key === 'cpf' || key === 'Cpf' || key === 'CPF_CLIENTE'
            );

            if (!cpfColumn || !row[cpfColumn]) {
              errors.push(`Linha ${index + 2}: CPF não encontrado ou vazio`);
              return null;
            }

            // Formatar o CPF
            const cpfFormatado = formatarCPF(row[cpfColumn]);

            return {
              ...row,
              ID: id,
              CPF: cpfFormatado
            };
          }).filter(Boolean);

          setParsedData(validatedData);
          setValidationErrors(errors);

          // Se tiver mais de 20% de erros, mostrar um aviso mais proeminente
          if (errors.length > 0 && errors.length / results.data.length > 0.2) {
            setError(`O arquivo contém ${errors.length} CPFs inválidos de um total de ${results.data.length}. Verifique o formato do arquivo.`);
          }
        },
        error: (err) => {
          setIsUploading(false);
          setError(`Erro ao processar o arquivo CSV: ${err.message}`);
        }
      });
    } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      // Para arquivos Excel, mostrar mensagem explicando que é necessário converter para CSV
      setIsUploading(false);
      setError('Arquivos Excel (.xlsx/.xls) não são suportados diretamente. Por favor, exporte para CSV primeiro.');
    }
  };

  // Função que faz a consulta real para um CPF
  const consultarCpf = async (cpf: string, id: string): Promise<ProcessedResult> => {
    try {
      const cpfNumerico = cpf.replace(/[^\d]/g, '');

      const response = await fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: cpfNumerico })
      });

      if (!response.ok) {
        const logMessage = `Erro na consulta: ${response.status} - ${response.statusText}`;
        return {
          id: id,
          cpf: cpf,
          status: 'erro',
          mensagem: `Erro ${response.status}: ${response.statusText}`,
          log: logMessage,
          apiResponse: null
        };
      }

      const data = await response.json();
      let logMessage = '';

      // Processa a resposta
      if (data.codigo === "SIM") {
        logMessage = `Consulta OK: Saldo disponível - R$ ${data.valorliberado}`;
        return {
          id: id,
          cpf: cpf,
          nome: data.nome || '',
          status: 'com_saldo',
          valorLiberado: parseFloat(data.valorliberado || '0'),
          banco: data.banco || '',
          log: logMessage,
          apiResponse: data
        };
      } else {
        logMessage = `Consulta OK: Sem saldo disponível`;
        return {
          id: id,
          cpf: cpf,
          nome: data.nome || '',
          status: 'sem_saldo',
          valorLiberado: 0,
          log: logMessage,
          apiResponse: data
        };
      }
    } catch (error) {
      const logMessage = `Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      return {
        id: id,
        cpf: cpf,
        status: 'erro',
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        log: logMessage,
        apiResponse: null
      };
    }
  };

  // Função para aguardar um determinado tempo
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Função para processar todos os CPFs em lote
  const processAllCpfs = async () => {
    if (parsedData.length === 0) {
      setError('Não há dados válidos para processar.');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    // Inicializa os resultados
    const initialResults: ResultsSummary = {
      total: parsedData.length,
      comSaldo: 0,
      semSaldo: 0,
      erros: 0,
      pendentes: parsedData.length,
      detalhes: parsedData.map(row => ({
        id: row.ID || generateUniqueId(parsedData.indexOf(row)),
        cpf: row.CPF,
        nome: row.CLIENTE_NOME || row.nome || row.Nome || '',
        telefone: row.CLIENTE_CELULAR || row.telefone || row.Telefone || '',
        status: 'pendente',
      }))
    };

    setResults(initialResults);

    // Processamento sequencial com intervalo de 3 segundos entre cada consulta
    let processedCount = 0;
    let comSaldoCount = 0;
    let semSaldoCount = 0;
    let errosCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const id = row.ID || generateUniqueId(i);
      
      try {
        // Consulta o CPF atual
        const result = await consultarCpf(row.CPF, id);
        
        // Atualiza os contadores
        if (result.status === 'com_saldo') comSaldoCount++;
        else if (result.status === 'sem_saldo') semSaldoCount++;
        else if (result.status === 'erro') errosCount++;
        
        // Atualiza os resultados
        setResults(prevResults => {
          if (!prevResults) return null;
          
          const updatedDetails = [...prevResults.detalhes];
          const index = updatedDetails.findIndex(d => d.id === id);
          
          if (index !== -1) {
            updatedDetails[index] = result;
          }
          
          return {
            ...prevResults,
            comSaldo: comSaldoCount,
            semSaldo: semSaldoCount,
            erros: errosCount,
            pendentes: prevResults.total - (comSaldoCount + semSaldoCount + errosCount),
            detalhes: updatedDetails
          };
        });
        
        // Atualiza o progresso
        processedCount++;
        setProcessingProgress(Math.round((processedCount / parsedData.length) * 100));
        
        // Aguarda 3 segundos antes da próxima consulta (exceto para o último item)
        if (i < parsedData.length - 1) {
          await delay(3000); // Pausa de 3 segundos entre cada consulta
        }
      } catch (error) {
        console.error('Erro ao processar CPF:', row.CPF, error);
        errosCount++;
        
        // Atualiza os resultados com o erro
        setResults(prevResults => {
          if (!prevResults) return null;
          
          const updatedDetails = [...prevResults.detalhes];
          const index = updatedDetails.findIndex(d => d.id === id);
          
          if (index !== -1) {
            updatedDetails[index] = {
              id: id,
              cpf: row.CPF,
              status: 'erro',
              mensagem: 'Erro ao processar a consulta',
              log: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
            };
          }
          
          return {
            ...prevResults,
            comSaldo: comSaldoCount,
            semSaldo: semSaldoCount,
            erros: errosCount,
            pendentes: prevResults.total - (comSaldoCount + semSaldoCount + errosCount),
            detalhes: updatedDetails
          };
        });
        
        // Atualiza o progresso
        processedCount++;
        setProcessingProgress(Math.round((processedCount / parsedData.length) * 100));
        
        // Aguarda 3 segundos antes da próxima consulta (exceto para o último item)
        if (i < parsedData.length - 1) {
          await delay(3000);
        }
      }
    }

    setIsProcessing(false);
    setProcessingProgress(100);
  };

  // Função para reiniciar o processo
  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setResults(null);
    setError(null);
    setValidationErrors([]);
    setIsUploading(false);
    setIsProcessing(false);
    setProcessingProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para baixar os resultados
  const downloadResults = () => {
    if (!results || !file) return;

    // Extract headers from the original file
    const originalHeaders = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

    // Define the headers for the CSV export
    const exportHeaders = [...originalHeaders, "Status", "Valor Liberado", "Banco", "Mensagem", "Log"];

    // Prepare CSV content
    let csvContent = exportHeaders.map(header => `"${header}"`).join(",") + "\n";

    results.detalhes.forEach((item, index) => {
      const originalData = parsedData[index] || {};

      const status = item.status === 'com_saldo' ? 'Com Saldo' :
        item.status === 'sem_saldo' ? 'Sem Saldo' :
        item.status === 'pendente' ? 'Pendente' : 'Erro';
      const valor = item.valorLiberado ? item.valorLiberado.toFixed(2) : '0.00';
      const banco = item.banco || '';
      const mensagem = item.mensagem || '';
      const log = item.log || '';

      // Map original data and add the new fields
      const row = exportHeaders.map(header => {
        if (header === "Status") return status;
        if (header === "Valor Liberado") return valor;
        if (header === "Banco") return `"${banco}"`;
        if (header === "Mensagem") return `"${mensagem}"`;
        if (header === "Log") return `"${log}"`;
        return `"${originalData[header] || ''}"`;
      }).join(",");

      csvContent += row + "\n";
    });

    // Create a blob and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `resultados_consulta_fgts_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderiza o resultado do processamento
  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Resultados da Consulta em Lote</h2>
          <button
            onClick={downloadResults}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            disabled={isProcessing || results.pendentes === results.total}
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar Resultados
          </button>
        </div>

        <div className="p-6">
          {/* Barra de progresso */}
          {isProcessing && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${processingProgress}%` }}
                >
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2 text-center">
                Processando consultas... ({processingProgress}%)
              </div>
            </div>
          )}

          {/* Resumo dos resultados */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total de CPFs</div>
              <div className="text-2xl font-bold">{results.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Com Saldo</div>
              <div className="text-2xl font-bold text-green-600">
                {results.comSaldo}
                <span className="text-sm text-gray-500 font-normal ml-1">
                  ({Math.round(results.comSaldo / results.total * 100) || 0}%)
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Sem Saldo</div>
              <div className="text-2xl font-bold text-gray-600">
                {results.semSaldo}
                <span className="text-sm text-gray-500 font-normal ml-1">
                  ({Math.round(results.semSaldo / results.total * 100) || 0}%)
                </span>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Erros</div>
              <div className="text-2xl font-bold text-red-600">
                {results.erros}
                <span className="text-sm text-gray-500 font-normal ml-1">
                  ({Math.round(results.erros / results.total * 100) || 0}%)
                </span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Pendentes</div>
              <div className="text-2xl font-bold text-blue-600">
                {results.pendentes}
                <span className="text-sm text-gray-500 font-normal ml-1">
                  ({Math.round(results.pendentes / results.total * 100) || 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de resultados */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensagem
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.detalhes.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.nome || '-'}</td>
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
                      {item.status === 'pendente' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.valorLiberado ? `R$ ${item.valorLiberado.toFixed(2)}` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.banco || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.mensagem || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.apiResponse && (
                        <button 
                          onClick={() => setSelectedLog({cpf: item.cpf, response: item.apiResponse})}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                        >
                          Ver Log
                        </button>
                      )}
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
            Faça o upload de um arquivo CSV contendo uma lista de CPFs para consulta em lote.
            O arquivo deve conter uma coluna com o título "CPF" contendo os números de CPF a serem consultados.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
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
                Formatos suportados: CSV - Máx. 5MB
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
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mt-4">
              <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md flex items-start">
                <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Foram encontrados alguns problemas no arquivo:</p>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {validationErrors.slice(0, 10).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {validationErrors.length > 10 && (
                        <li>...e mais {validationErrors.length - 10} problemas.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="mt-4">
              <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="text-sm">
                  {parsedData.length} CPFs válidos encontrados no arquivo.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={processAllCpfs}
            disabled={parsedData.length === 0 || isUploading || isProcessing}
            className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              parsedData.length === 0 || isUploading || isProcessing
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
      </div>

      {results && renderResults()}

      
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center">
                <FileJson className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">
                  Log da Consulta: CPF {selectedLog.cpf}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[calc(80vh-8rem)]">
                {JSON.stringify(selectedLog.response, null, 2)}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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

export default ConsultaLote;
