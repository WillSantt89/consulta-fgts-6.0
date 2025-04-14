import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, FileText, AlertCircle, CheckCircle, XCircle, Download, Info, X, FileJson, Play, Pause, Trash2, Search } from 'lucide-react';
import Papa from 'papaparse';
import { BatchItem, ProcessedResult, ResultsSummary, FiltrosState } from '../types';
import { formatarCPF, formatarTelefone, formatarData } from '../utils';
import FileUploadSection from './CampanhasEmLote/FileUploadSection';
import CampaignControlSection from './CampanhasEmLote/CampaignControlSection';
import StatisticsSection from './CampanhasEmLote/StatisticsSection';
import BatchHistoryTable from './CampanhasEmLote/BatchHistoryTable';
import FilterSection from './CampanhasEmLote/FilterSection';
import { useApiData } from '../hooks/useApiData';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [apiEndpointSelected, setApiEndpointSelected] = useState<string>('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta');

  const { apiData, apiDataLoading, apiDataError, fetchApiData } = useApiData('https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/inserindo-consulta-lot');

  const [filtros, setFiltros] = useState<FiltrosState>({
    status: 'todos',
    banco: '',
    valorMinimo: 0,
    busca: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [bancosDisponiveis, setBancosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    if (campaignResults.length > 0) {
      const bancos = [...new Set(campaignResults.map(c => c.banco || '').filter(b => b))];
      setBancosDisponiveis(bancos);
    }
  }, [campaignResults]);

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
      cpf: item.CPF
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
      const id = setInterval(processNextRecord, 500);
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
      stopCampaign();
      setSuccessMessage('Processamento concluído! Todos os CPFs foram consultados.');
      return;
    }

    const record = campaignResults[nextIndex];
    if (!record) return;

    setCampaignResults((prevResults) => {
      const newResults = [...prevResults];
      newResults[nextIndex] = {
        ...newResults[nextIndex],
        status: 'processing',
      };
      return newResults;
    });

    try {
      const response = await fetch(apiEndpointSelected, {
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
      const { ID, cpf, nome, telefone, status, valorLiberado, banco, mensagem, log } = result;

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

  useEffect(() => {
    if (totalRecords > 0) {
      const progress = Math.round((processedCount / totalRecords) * 100);
      setProcessingProgress(progress);
    }
  }, [processedCount, totalRecords]);

  const handleStartConsultation = async (batchId: string) => {
    // Implement the start consultation logic here
    console.log(`Starting consultation for batch with ID: ${batchId}`);
    try {
      const response = await fetch('https://n8n-queue-2-n8n-webhook.mrt7ga.easypanel.host/webhook/iniciando-consulta-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start consultation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Consulta iniciada com sucesso:', data);
      // Optionally, update the UI to reflect the starting process
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      setError(error.message || 'Failed to start consultation.');
    }
  };

  const handleFilterChange = (newFiltros: Partial<FiltrosState>) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      ...newFiltros
    }));
  };

  const aplicarFiltros = () => {
    let clientesFiltrados = [...campaignResults];

    if (filtros.status !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter(c => c.status === filtros.status);
    }

    if (filtros.banco) {
      clientesFiltrados = clientesFiltrados.filter(c => c.banco === filtros.banco);
    }

    if (filtros.valorMinimo > 0) {
      clientesFiltrados = clientesFiltrados.filter(c => c.valorLiberado >= filtros.valorMinimo);
    }

    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase();
      clientesFiltrados = clientesFiltrados.filter(c =>
        c.cpf.includes(termoBusca) ||
        (c.nome && c.nome.toLowerCase().includes(termoBusca))
      );
    }

    setCampaignResults(clientesFiltrados);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, campaignResults]);

  const limparFiltros = () => {
    setFiltros({
      status: 'todos',
      banco: '',
      valorMinimo: 0,
      busca: ''
    });
  };

  const filteredApiData = apiData.filter(item =>
    item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.batch_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Consultas em Lote 2.0</h2>

      <FileUploadSection
        file={file}
        isUploading={isUploading}
        handleFileChange={handleFileChange}
        error={error}
        validationErrors={validationErrors}
        handleReset={handleReset}
        fileInputRef={fileInputRef}
      />

      {parsedData.length > 0 && !isUploading && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <select
              value={apiEndpointSelected}
              onChange={(e) => setApiEndpointSelected(e.target.value)}
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

      {(batchId || campaignResults.length > 0) && (
        <CampaignControlSection
          batchId={batchId}
          batchStatus={batchStatus}
          campaignStatus={campaignStatus}
          startCampaign={startCampaign}
          pauseCampaign={pauseCampaign}
          resumeCampaign={resumeCampaign}
          stopCampaign={stopCampaign}
          downloadResults={downloadResults}
          processedCount={processedCount}
          totalRecords={totalRecords}
          processingProgress={processingProgress}
          stats={stats}
          batchInvalidRecords={batchInvalidRecords}
        />
      )}

      <FilterSection
        filtros={filtros}
        mostrarFiltros={mostrarFiltros}
        setMostrarFiltros={setMostrarFiltros}
        handleFilterChange={handleFilterChange}
        limparFiltros={limparFiltros}
        bancosDisponiveis={bancosDisponiveis}
      />

      <StatisticsSection
        estatisticas={{
          total: campaignResults.length,
          pendentes: campaignResults.filter(r => r.status === 'pendente').length,
          enviados: campaignResults.filter(r => r.status === 'enviado').length,
          erros: campaignResults.filter(r => r.status === 'erro').length,
          cancelados: campaignResults.filter(r => r.status === 'cancelado').length
        }}
      />

      <BatchHistoryTable
        apiDataLoading={apiDataLoading}
        apiDataError={apiDataError}
        filteredApiData={filteredApiData}
        handleStartConsultation={handleStartConsultation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

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
