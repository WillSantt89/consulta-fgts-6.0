import React, { useState, useRef, useEffect } from 'react';
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
  const [batchId, setBatchId] = useState<string | null>(null); // State to hold the batch ID
  const [batchStatus, setBatchStatus] = useState<string | null>(null); // State to hold the batch status
  const [batchInvalidRecords, setBatchInvalidRecords] = useState<any[]>([]); // State to hold invalid records

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

  // Função para processar todos os CPFs em lote
  const processAllCpfs = async () => {
    // Instead of the old logic, call the new API
    // await sendBatchToApi();
  };

  // Função para enviar os dados para a API
  const sendDataToApi = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError('Nenhum dado válido para enviar.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);
    setBatchId(null);
    setBatchStatus(null);
    setBatchInvalidRecords([]);

    const apiUrl = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot';
    const fileName = file?.name || 'importacao.csv'; // Use o nome do arquivo ou um padrão

    const requestBody = {
      tipo: 'api',
      arquivo_nome: fileName,
      consultas: parsedData.map(row => ({
        cpf: row.CPF,
        nome: row.nome,
        telefone: row.telefone,
      })),
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(null); // Limpa resultados anteriores
        setBatchId(data.batch.batch_id);
        setBatchStatus(data.batch.status);
        setBatchInvalidRecords(data.registros_invalidos || []);
        setError(null); // Limpa erros anteriores
      } else {
        setError(data.message || 'Erro ao processar o lote.');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao conectar com a API.');
    } finally {
      setIsProcessing(false);
    }
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
    setBatchId(null);
    setBatchStatus(null);
    setBatchInvalidRecords([]);
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
    if (!results && !batchId) return null;

    return (
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Resultados da Consulta em Lote</h2>
          <button
            onClick={downloadResults}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            disabled={isProcessing || !batchId}
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
          {batchId && (
            <div className="mb-4">
              <p>Batch ID: {batchId}</p>
              <p>Status: {batchStatus || 'Processando...'}</p>
            </div>
          )}

          {batchInvalidRecords.length > 0 && (
            <div className="mt-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                <h3 className="text-sm font-medium">Registros Inválidos:</h3>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {batchInvalidRecords.map((record, index) => (
                    <li key={index}>
                      CPF: {record.cpf}, Nome: {record.nome}, Erro: {record.erro}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
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

          {parsedData.length > 0 && !isUploading && (
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

        {parsedData.length > 0 && !isUploading && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={sendDataToApi}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirmar Importação
            </button>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      {renderResults()}

      
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
