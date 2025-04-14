import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, FileText, AlertCircle, CheckCircle, XCircle, Download, Info, X, FileJson, Play, Pause, Trash2, Search } from 'lucide-react';
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

interface BatchItem {
  id: number;
  batch_id: string;
  type_consultation: string;
  created_at: string;
  file_name: string;
  total_records: number;
  processed_records: number;
  status: string;
}

const ConsultasLote2: React.FC = () => {
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
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for API data
  const [apiData, setApiData] = useState<BatchItem[]>([]);
  const [apiDataLoading, setApiDataLoading] = useState<boolean>(true);
  const [apiDataError, setApiDataError] = useState<string | null>(null);

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      setSuccessMessage(null);

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
    setCampaignResults(parsedData.map(item => ({ 
      ...item, 
      status: 'pendente',
      cpf: item.CPF // Garantir que estamos usando o campo CPF
    })));

    const apiUrl = 'https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot';
    const fileName = file?.name || 'importacao.csv';

    const requestBody = {
      tipo: 'api',
      arquivo_nome: fileName,
      consultas: parsedData.map(row => ({
        cpf: row.CPF,
        nome: row.CLIENTE_NOME || row.nome,
        telefone: row.CLIENTE_CELULAR || row.telefone,
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

      if (!response.ok) {
        throw new Error(`Erro ao processar o lote: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success || data.batch) {
        setBatchId(data.batch?.batch_id || data.batchId);
        setBatchStatus(data.batch?.status || 'processando');
        setBatchInvalidRecords(data.registros_invalidos || []);
        setError(null);
        setSuccessMessage('Lote enviado com sucesso! Iniciando processamento...');
        startCampaign();
        // Refresh the API data after successful import
        fetchApiData();
      } else {
        setError(data.message || 'Erro ao processar o lote.');
        setCampaignStatus('idle');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao conectar com a API.');
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
      const id = setInterval(processNextRecord, 500); // Ajuste o intervalo conforme necessário
      setIntervalId(id);
      setSuccessMessage('Processamento iniciado. Consultando CPFs...');
    }
  };

  const pauseCampaign = () => {
    setCampaignStatus('paused');
    setSuccessMessage('Processamento pausado. Clique em Retomar para continuar.');
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const resumeCampaign = () => {
    startCampaign();
    setSuccessMessage('Processamento retomado.');
  };

  const stopCampaign = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCampaignStatus('idle');
    setSuccessMessage('Processamento finalizado.');
  };

  const processNextRecord = async () => {
    if (campaignStatus !== 'running') {
      return;
    }

    const nextIndex = campaignResults.findIndex(
      (result) => result.status === 'pendente'
    );

    if (nextIndex === -1) {
      // Campanha finalizada
      stopCampaign();
      setSuccessMessage('Processamento concluído! Todos os CPFs foram consultados.');
      return;
    }

    const record = campaignResults[nextIndex];
    if (!record) return;

    // Atualizar o status para processing
    setCampaignResults((prevResults) => {
      const newResults = [...prevResults];
      newResults[nextIndex] = {
        ...newResults[nextIndex],
        status: 'processing',
      };
      return newResults;
    });

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: record.cpf }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Verifica se tem saldo baseado na resposta da API
      let newStatus: ProcessedResult['status'] = 'erro';
      if (data.codigo === 'SIM') {
        newStatus = 'com_saldo';
      } else if (data.codigo === 'NAO') {
        newStatus = 'sem_saldo';
      }

      const updatedRecord = {
        ...record,
        status: newStatus,
        apiResponse: data,
        valorLiberado: data.valorliberado ? parseFloat(data.valorliberado) : 0,
        banco: data.banco || '',
        mensagem: data.mensagem || data.message || '',
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
      // Extrair os campos necessários
      const { ID, cpf, nome, telefone, status, valorLiberado, banco, mensagem, log } = result;
      
      // Formatar o status para exibição
      const statusFormatado = 
        status === 'com_saldo' ? 'Com Saldo' : 
        status === 'sem_saldo' ? 'Sem Saldo' : 
        status === 'erro' ? 'Erro' : 
        status === 'pendente' ? 'Pendente' : 
        status === 'processing' ? 'Processando' : 'Pausado';

      return [
        ID || '',
        cpf || '',
        nome || '',
        telefone || '',
        statusFormatado,
        valorLiberado ? valorLiberado.toFixed(2) : '',
        banco || '',
        mensagem || '',
        log || '',
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
    link.setAttribute('download', `resultados_consulta_fgts_${timestamp}.csv`);
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
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // Calcular estatísticas dos resultados
  const calculateStatistics = () => {
    if (!campaignResults || campaignResults.length === 0) {
      return {
        total: 0,
        comSaldo: 0,
        semSaldo: 0,
        erro: 0,
        pendente: 0,
        processamento: 0
      };
    }

    return {
      total: campaignResults.length,
      comSaldo: campaignResults.filter(r => r.status === 'com_saldo').length,
      semSaldo: campaignResults.filter(r => r.status === 'sem_saldo').length,
      erro: campaignResults.filter(r => r.status === 'erro').length,
      pendente: campaignResults.filter(r => r.status === 'pendente').length,
      processamento: campaignResults.filter(r => ['processing', 'paused'].includes(r.status)).length
    };
  };

  const stats = calculateStatistics();

  // Calcular o progresso do processamento
  useEffect(() => {
    if (totalRecords > 0) {
      const progress = Math.round((processedCount / totalRecords) * 100);
      setProcessingProgress(progress);
    }
  }, [processedCount, totalRecords]);

  // Fetch API data
  const fetchApiData = async () => {
    setApiDataLoading(true);
    setApiDataError(null);
    try {
      const response = await fetch('https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot');
      if (!response.ok) {
        throw new Error(`Failed to fetch API data: ${response.status} ${response.statusText}`);
      }
      const data: BatchItem[] = await response.json();
      setApiData(data);
    } catch (error: any) {
      setApiDataError(error.message);
    } finally {
      setApiDataLoading(false);
    }
  };

  useEffect(() => {
    fetchApiData();
  }, []);

  // Function to delete a batch item
  const handleDeleteBatch = async (batchId: string) => {
    // Implement the delete logic here
    console.log(`Deleting batch with ID: ${batchId}`);
    // Example API call (replace with your actual API endpoint)
    try {
      const response = await fetch(`https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot/${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete batch: ${response.status} ${response.statusText}`);
      }
      // Refresh the API data after successful deletion
      fetchApiData();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      setError(error.message || 'Failed to delete batch.');
    }
  };

  // Function to start consultation for a batch item
  const handleStartConsultation = (batchId: string) => {
    // Implement the start consultation logic here
    console.log(`Starting consultation for batch with ID: ${batchId}`);
    // You can add your API call or logic to start the consultation here
  };

  // Filtered API data based on search query
  const filteredApiData = apiData.filter(item =>
    item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.batch_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{successMessage}</p>
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
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <select
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta">API Padrão</option>
                <option value="https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/vctex/consulta">API VCTEX</option>
                <option value="https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/simulador/facta">API Facta</option>
              </select>
            </div>
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
      {(batchId || campaignResults.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Gerenciamento da Campanha</h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              {batchId && <p className="text-sm text-gray-600">Batch ID: {batchId}</p>}
              {batchStatus && <p className="text-sm text-gray-600">Status: {batchStatus}</p>}
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
                disabled={campaignResults.length === 0}
                className={`px-3 py-2 ${
                  campaignResults.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } rounded-md flex items-center`}
              >
                <Download className="h-4 w-4 mr-1" /> Exportar
              </button>
            </div>
          </div>

          {/* Barra de progresso */}
          {totalRecords > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Progresso: {processedCount} / {totalRecords} ({processingProgress}%)
              </p>
            </div>
          )}

          {/* Estatísticas */}
          {campaignResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Com Saldo</div>
                <div className="text-xl font-bold text-green-600">{stats.comSaldo}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Sem Saldo</div>
                <div className="text-xl font-bold text-red-600">{stats.semSaldo}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Erro</div>
                <div className="text-xl font-bold text-yellow-600">{stats.erro}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Pendente</div>
                <div className="text-xl font-bold text-blue-600">{stats.pendente}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Em Processo</div>
                <div className="text-xl font-bold text-purple-600">{stats.processamento}</div>
              </div>
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
      )}

      {/* Search input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por nome do arquivo ou Batch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 px-4 pr-10 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* API Data Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Histórico de Lotes</h3>
        {apiDataLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        ) : apiDataError ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{apiDataError}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome doArquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total de Registros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registros Processados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApiData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.batch_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.total_records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.processed_records}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'processing' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Processando
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Concluído
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Erro
                        </span>
                      )}
                      {/* Add more status mappings as needed */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleStartConsultation(item.batch_id)}
                          className="px-3 py-1 rounded text-xs flex items-center bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <Play className="h-3 w-3 mr-1" /> Iniciar Consulta
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(item.batch_id)}
                          className="px-3 py-1 rounded text-xs flex items-center bg-red-600 text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para detalhes da API */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Detalhes da Consulta - CPF: {selectedLog.cpf}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(selectedLog.response, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
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

export default ConsultasLote2;
