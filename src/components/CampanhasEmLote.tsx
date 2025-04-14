import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, FileText, AlertCircle, CheckCircle, XCircle, Download, Info, X, FileJson, Play, Pause } from 'lucide-react';
import Papa from 'papaparse';

interface ProcessedResult {
  id: string;
  cpf: string;
  nome?: string;
  telefone?: string;
  status: 'com_saldo' | 'sem_saldo' | 'erro' | 'pendente' | 'processing' | 'paused';
  valorLiberado?: number;
  banco?: string;
  mensagem?: string;
  log?: string;
  apiResponse?: any;
}

interface ResultsSummary {
  total: number;
  comSaldo: number;
  semSaldo: number;
  erros: number;
  pendentes: number;
  detalhes: ProcessedResult[];
}

const CampanhasEmLote: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [results, setResults] = useState<ResultsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<{ cpf: string; response: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [batchInvalidRecords, setBatchInvalidRecords] = useState<any[]>([]);
  const [campaignStatus, setCampaignStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [campaignResults, setCampaignResults] = useState<ProcessedResult[]>([]);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const generateUniqueId = (index: number): string => {
    const timestamp = new Date().getTime();
    return `REQ${timestamp}${index.toString().padStart(4, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setValidationErrors([]);
      setParsedData([]);
      setResults(null);
      setBatchId(null);
      setBatchStatus(null);
      setBatchInvalidRecords([]);
      setCampaignStatus('idle');
      setProcessedCount(0);
      setTotalRecords(0);
      setCampaignResults([]);

      parseFile(selectedFile);
    }
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Formato de arquivo inválido. Por favor, envie um arquivo CSV ou Excel.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
      return false;
    }

    return true;
  };

  const formatarCPF = (cpf: string): string => {
    const cpfNumerico = cpf.replace(/\D/g, '');
    const cpfPreenchido = cpfNumerico.padStart(11, '0');
    return cpfPreenchido;
  };

  const parseFile = (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setError(null);

    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsUploading(false);

          const headers = results.meta.fields || [];

          if (!headers.some(header =>
            header === 'CPF' || header === 'cpf' ||
            header === 'Cpf' || header === 'CPF_CLIENTE'
          )) {
            setError('O arquivo CSV não possui uma coluna de CPF. Por favor, verifique o formato do arquivo.');
            return;
          }

          const errors: string[] = [];
          const validatedData = results.data.map((row: any, index: number) => {
            const id = row.ID || generateUniqueId(index);

            const cpfColumn = Object.keys(row).find(key =>
              key === 'CPF' || key === 'cpf' || key === 'Cpf' || key === 'CPF_CLIENTE'
            );

            if (!cpfColumn || !row[cpfColumn]) {
              errors.push(`Linha ${index + 2}: CPF não encontrado ou vazio`);
              return null;
            }

            const cpfFormatado = formatarCPF(row[cpfColumn]);

            return {
              ...row,
              ID: id,
              CPF: cpfFormatado,
              status: 'pendente' as const,
            };
          }).filter(Boolean);

          setParsedData(validatedData);
          setTotalRecords(validatedData.length);
          setValidationErrors(errors);

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
      setIsUploading(false);
      setError('Arquivos Excel (.xlsx/.xls) não são suportados diretamente. Por favor, exporte para CSV primeiro.');
    }
  };

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
    setCampaignStatus('running');
    setProcessedCount(0);
    setCampaignResults(parsedData.map(item => ({ ...item, status: 'pendente' })));

    const apiUrl = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot';
    const fileName = file?.name || 'importacao.csv';

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
        setBatchId(data.batch.batch_id);
        setBatchStatus(data.batch.status);
        setBatchInvalidRecords(data.registros_invalidos || []);
        setError(null);
        startCampaign();
      } else {
        setError(data.message || 'Erro ao processar o lote.');
        setIsProcessing(false);
        setCampaignStatus('idle');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao conectar com a API.');
      setIsProcessing(false);
      setCampaignStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const startCampaign = () => {
    if (campaignStatus !== 'running') {
      setCampaignStatus('running');
      if (intervalId) {
        clearInterval(intervalId);
      }
      const id = setInterval(processNextRecord, 500); // Adjust interval as needed
      setIntervalId(id);
    }
  };

  const pauseCampaign = () => {
    setCampaignStatus('paused');
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const resumeCampaign = () => {
    startCampaign();
  };

  const stopCampaign = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCampaignStatus('idle');
  };

  const processNextRecord = async () => {
    if (campaignStatus !== 'running') {
      return;
    }

    const nextIndex = campaignResults.findIndex(
      (result) => result.status === 'pendente'
    );

    if (nextIndex === -1) {
      // Campaign finished
      stopCampaign();
      return;
    }

    const record = campaignResults[nextIndex];
    if (!record) return;

    const apiUrl = 'https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta'; // Replace with your API endpoint

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: record.CPF }),
      });

      const data = await response.json();

      const newStatus = data.success ? 'com_saldo' : 'sem_saldo'; // Adjust based on your API response
      const updatedRecord = {
        ...record,
        status: newStatus,
        apiResponse: data,
      };

      setCampaignResults((prevResults) => {
        const newResults = [...prevResults];
        newResults[nextIndex] = updatedRecord;
        return newResults;
      });
    } catch (error: any) {
      const updatedRecord = {
        ...record,
        status: 'erro',
        log: error.message || 'Erro ao consultar CPF',
      };
      setCampaignResults((prevResults) => {
        const newResults = [...prevResults];
        newResults[nextIndex] = updatedRecord;
        return newResults;
      });
    } finally {
      setProcessedCount((prevCount) => prevCount + 1);
    }
  };

  const downloadResults = () => {
    if (!campaignResults || campaignResults.length === 0) return;

    const csvHeaders = ['ID', 'CPF', 'Nome', 'Telefone', 'Status', 'Valor Liberado', 'Banco', 'Mensagem', 'Log'];
    const csvRows = campaignResults.map(result => {
      const { ID, CPF, nome, telefone, status, apiResponse } = result;
      const valorLiberado = apiResponse?.valorLiberado || '';
      const banco = apiResponse?.banco || '';
      const mensagem = apiResponse?.mensagem || '';
      const log = result.log || '';

      return [
        ID,
        CPF,
        nome || '',
        telefone || '',
        status === 'com_saldo' ? 'Com Saldo' : status === 'sem_saldo' ? 'Sem Saldo' : status === 'erro' ? 'Erro' : 'Pendente',
        valorLiberado,
        banco,
        mensagem,
        log,
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell !== null && cell !== undefined ? cell.toString().replace(/"/g, '""') : ''}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `resultados_campanha_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    setCampaignStatus('idle');
    setProcessedCount(0);
    setTotalRecords(0);
    setCampaignResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Consultas em Lote 2.0</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Importar Arquivo CSV</h3>

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

        {parsedData.length > 0 && !isUploading && (
          <div className="flex justify-end">
            <button
              onClick={sendDataToApi}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirmar Importação e Iniciar
            </button>
          </div>
        )}
      </div>

      {/* Campaign Control and Results */}
      {batchId && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Gerenciamento da Campanha</h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Batch ID: {batchId}</p>
              <p className="text-sm text-gray-600">Status: {batchStatus || 'Processando...'}</p>
            </div>
            <div className="flex items-center space-x-2">
              {campaignStatus === 'idle' && (
                <button
                  onClick={startCampaign}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                >
                  <Play className="h-4 w-4 mr-1" /> Iniciar
                </button>
              )}
              {campaignStatus === 'running' && (
                <>
                  <button
                    onClick={pauseCampaign}
                    className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
                  >
                    <Pause className="h-4 w-4 mr-1" /> Pausar
                  </button>
                </>
              )}
              {campaignStatus === 'paused' && (
                <>
                  <button
                    onClick={resumeCampaign}
                    className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <Play className="h-4 w-4 mr-1" /> Retomar
                  </button>
                </>
              )}
              {(campaignStatus === 'running' || campaignStatus === 'paused') && (
                <button
                  onClick={stopCampaign}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" /> Parar
                </button>
              )}
              <button
                onClick={downloadResults}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <Download className="h-4 w-4 mr-1" /> Exportar
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(processedCount / totalRecords) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Progresso: {processedCount} / {totalRecords}
            </p>
          </div>

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
      )}

      {/* Results Table */}
      {campaignResults.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Resultados da Campanha</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignResults.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.CPF}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ```typescript
                      {result.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'com_saldo' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Com Saldo
                        </span>
                      )}
                      {result.status === 'sem_saldo' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Sem Saldo
                        </span>
                      )}
                      {result.status === 'erro' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Erro
                        </span>
                      )}
                      {result.status === 'pendente' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      )}
                      {result.status === 'processing' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Processando
                        </span>
                      )}
                      {result.status === 'paused' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pausado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampanhasEmLote;
