import React, { useState, useEffect } from 'react';
import { Upload, Download, Play, RefreshCcw, Filter, FileText, ChevronUp, ChevronDown, Pause } from 'lucide-react';
import Papa from 'papaparse';

const Campanhas: React.FC = () => {
  const [activeView, setActiveView] = useState('lista'); // 'lista' ou 'nova' ou 'detalhes'
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedCampanha, setSelectedCampanha] = useState<any>(null);
  const [campanhas, setCampanhas] = useState<any[]>([
    {
      id: 1,
      nome: 'Campanha Janeiro/2023',
      status: 'concluido',
      total: 320,
      comSaldo: 248,
      semSaldo: 62,
      erro: 10,
      data: '10/01/2023',
      consultationLogs: [] // Add consultationLogs array
    },
    {
      id: 2,
      nome: 'Campanha Dezembro/2022',
      status: 'concluido',
      total: 450,
      comSaldo: 312,
      semSaldo: 123,
      erro: 15,
      data: '15/12/2022',
      consultationLogs: [] // Add consultationLogs array
    },
    {
      id: 3,
      nome: 'Campanha Novembro/2022',
      status: 'concluido',
      total: 275,
      comSaldo: 183,
      semSaldo: 82,
      erro: 10,
      data: '22/11/2022',
      consultationLogs: [] // Add consultationLogs array
    },
    {
      id: 4,
      nome: 'Campanha Fevereiro/2023',
      status: 'em_andamento',
      total: 150,
      processados: 68,
      data: '05/02/2023',
      consultationLogs: [] // Add consultationLogs array
    }
  ]);
  const [clients, setClients] = useState<any[]>([]); // Simulated "database" for clients
  const [campaignTimeouts, setCampaignTimeouts] = useState<{ [key: number]: number }>({}); // Store timeouts for pausing
  const [consultationLogs, setConsultationLogs] = useState<any[]>([]);

  // Dados de exemplo para a visualização detalhada da campanha
  const detalheCampanha = {
    id: 1,
    nome: 'Campanha Janeiro/2023',
    status: 'concluido',
    dataInicio: '10/01/2023 08:30',
    dataFim: '10/01/2023 09:45',
    totalCPFs: 320,
    resultados: [
      { nome: 'João da Silva', cpf: '123.456.789-00', telefone: '(11) 98765-4321', status: 'com_saldo', saldo: 2480.45, ultimaTentativa: '10/01/2023 08:31' },
      { nome: 'Maria Oliveira', cpf: '987.654.321-00', telefone: '(11) 91234-5678', status: 'com_saldo', saldo: 1850.32, ultimaTentativa: '10/01/2023 08:32' },
      { nome: 'José Santos', cpf: '456.789.123-00', telefone: '(11) 95678-1234', status: 'sem_saldo', saldo: 0, ultimaTentativa: '10/01/2023 08:33' },
      { nome: 'Ana Pereira', cpf: '789.123.456-00', telefone: '(11) 94321-8765', status: 'erro', saldo: null, ultimaTentativa: '10/01/2023 08:34' },
      { nome: 'Carlos Ferreira', cpf: '321.654.987-00', telefone: '(11) 97890-1234', status: 'com_saldo', saldo: 3240.50, ultimaTentativa: '10/01/2023 08:35' }
    ]
  };
  
  // Simula upload de arquivo CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setPreviewData(results.data);
        },
        error: (err) => {
          console.error("Error parsing CSV:", err);
          alert("Erro ao processar o arquivo CSV.");
        }
      });
    }
  };
  
  const handleImportClients = () => {
    if (previewData.length === 0) {
      alert('Por favor, faça o upload de um arquivo CSV válido.');
      return;
    }
    setClients(previewData);
    alert('Clientes importados com sucesso!');
  };
  
  // Simulação de início de campanha
  const iniciarCampanha = () => {
    const campanhaNomeInput = document.getElementById('campanha-nome') as HTMLInputElement | null;
    const campanhaNome = campanhaNomeInput?.value;
    
    if (!campanhaNome || campanhaNome.trim() === '') {
      alert('Por favor, insira um nome para a campanha.');
      return;
    }
    
    if (clients.length === 0) {
      alert('Por favor, importe os clientes primeiro.');
      return;
    }
    
    const newCampanha = {
      id: campanhas.length + 1,
      nome: campanhaNome,
      status: 'pausada', // Inicialmente pausada
      total: clients.length,
      processados: 0,
      data: new Date().toLocaleDateString('pt-BR'),
      clientes: [...clients], // Save clients to the campaign
      consultationLogs: []
    };
    
    setCampanhas([...campanhas, newCampanha]);
    setActiveView('lista');
    
    // Clear the input and clients after campaign creation
    if (campanhaNomeInput) {
      campanhaNomeInput.value = '';
    }
    setClients([]);
    setUploadedFile(null);
    setPreviewData([]);
  };

  const runCampaign = (campanhaId: number) => {
    setCampanhas(prevCampanhas =>
      prevCampanhas.map(campanha =>
        campanha.id === campanhaId ? { ...campanha, status: 'em_andamento', processados: 0 } : campanha
      )
    );

    const campanha = campanhas.find(c => c.id === campanhaId);
    if (!campanha || !campanha.clientes) return;

    const totalClientes = campanha.clientes.length;
    let clientesProcessados = 0;
    const tempoEntreConsultas = parseInt((document.getElementById('tempo-entre-consultas') as HTMLInputElement)?.value || '500', 10);

    const processClient = (index: number) => {
      if (index >= campanha.clientes.length) {
        // Campaign finished
        setCampanhas(prevCampanhas =>
          prevCampanhas.map(campanha =>
            campanha.id === campanhaId ? { ...campanha, status: 'concluido' } : campanha
          )
        );
        return;
      }

      const cliente = campanha.clientes[index];
      // Call the API here
      fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: cliente.CPF }) // Assuming CPF is the correct field name
      })
      .then(response => response.json())
      .then(data => {
        console.log('API Response:', data);
        // Store the consultation log
        const logEntry = {
          cpf: cliente.CPF,
          nome: cliente.CLIENTE_NOME,
          telefone: cliente.CLIENTE_CELULAR,
          status: data.status || 'success', // Adjust based on actual API response
          data: new Date().toLocaleDateString('pt-BR'),
          hora: new Date().toLocaleTimeString('pt-BR')
        };

        setCampanhas(prevCampanhas => {
          return prevCampanhas.map(campanha => {
            if (campanha.id === campanhaId) {
              return {
                ...campanha,
                consultationLogs: [...campanha.consultationLogs, logEntry]
              };
            }
            return campanha;
          });
        });
      })
      .catch(error => {
        console.error('API Error:', error);
        // Handle the error here
      });

      // Simulate processing
      setTimeout(() => {
        // Simulate a random status
        const status = ['com_saldo', 'sem_saldo', 'erro'][Math.floor(Math.random() * 3)];
        // Update client status (in a real app, you'd update the database)
        // For this simulation, we'll just log it.
        console.log(`Processando ${cliente.CLIENTE_NOME} - Status: ${status}`);
        clientesProcessados++;

        setCampanhas(prevCampanhas =>
          prevCampanhas.map(campanha =>
            campanha.id === campanhaId ? { ...campanha, processados: clientesProcessados } : campanha
          )
        );

        processClient(index + 1);
      }, tempoEntreConsultas);
    };

    processClient(0);
  };

  const handleStartCampanha = (id: number) => {
    runCampaign(id);
  };

  const handlePauseCampanha = (id: number) => {
    setCampanhas(prevCampanhas =>
      prevCampanhas.map(campanha =>
        campanha.id === id ? { ...campanha, status: 'pausada' } : campanha
      )
    );
  };
  
  // Renderiza lista de campanhas
  const renderListaCampanhas = () => (
    <>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-800">Campanhas de Consultas</h2>
        <button
          onClick={() => setActiveView('nova')}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          Nova Campanha
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campanha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Com Saldo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sem Saldo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Erro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campanhas.map((campanha) => (
              <tr key={campanha.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{campanha.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {campanha.status === 'concluido' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Concluído
                    </span>
                  ) : campanha.status === 'em_andamento' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Em Andamento ({Math.round((campanha.processados / campanha.total) * 100)}%)
                    </span>
                  ) : campanha.status === 'pausada' ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pausada
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Agendada
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campanha.total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campanha.comSaldo || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campanha.semSaldo || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campanha.erro || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campanha.data}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => {
                      setSelectedCampanha(campanha);
                      setActiveView('detalhes');
                      setConsultationLogs(campanha.consultationLogs); // Set consultation logs
                    }}
                    className="text-green-600 hover:text-green-900 mr-3"
                  >
                    Ver
                  </button>
                  {campanha.status === 'pausada' && (
                    <button
                      onClick={() => handleStartCampanha(campanha.id)}
                      className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600 mr-1"
                    >
                      <Play className="h-3 w-3 inline mr-1" /> Iniciar
                    </button>
                  )}
                  {campanha.status === 'em_andamento' && (
                    <button
                      onClick={() => handlePauseCampanha(campanha.id)}
                      className="px-2 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600 mr-1"
                    >
                      <Pause className="h-3 w-3 inline mr-1" /> Pausar
                    </button>
                  )}
                  <button className="text-gray-600 hover:text-gray-900">
                    Exportar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
  
  // Renderiza formulário para nova campanha
  const renderNovaCampanha = () => (
    <>
      <div className="mb-6 flex items-center">
        <button
          onClick={() => setActiveView('lista')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </button>
        <h2 className="text-xl font-medium text-gray-800">Nova Campanha</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label htmlFor="campanha-nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Campanha
          </label>
          <input
            type="text"
            id="campanha-nome"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3 border"
            placeholder="Ex: Campanha Fevereiro/2023"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo CSV com CPFs
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                  <span>Selecionar arquivo</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileUpload} 
                  />
                </label>
                <p className="pl-1">ou arraste e solte</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV com colunas: Nome, CPF, Telefone
              </p>
            </div>
          </div>
        </div>
        
        {uploadedFile && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Preview: {uploadedFile.name}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {row['CLIENTE_NOME']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {row['CPF']}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {row['CLIENTE_CELULAR']}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mostrando {previewData.length} de {previewData.length} registros
            </p>
          </div>
        )}
        
        {previewData.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleImportClients}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Importar
            </button>
          </div>
        )}
        
        {clients.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agendamento
              </label>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="agendamento-imediato"
                  name="agendamento"
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"
                  defaultChecked
                />
                <label htmlFor="agendamento-imediato" className="ml-2 block text-sm text-gray-700">
                  Executar imediatamente
                </label>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="radio"
                  id="agendamento-programado"
                  name="agendamento"
                  className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"
                />
                <label htmlFor="agendamento-programado" className="ml-2 block text-sm text-gray-700">
                  Agendar para data específica
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="tempo-entre-consultas" className="block text-sm font-medium text-gray-700 mb-1">
                Tempo entre consultas (ms)
              </label>
              <input
                type="number"
                id="tempo-entre-consultas"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3 border"
                defaultValue="500"
                min="100"
                max="5000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recomendado: 500ms (consultas muito rápidas podem ser bloqueadas)
              </p>
            </div>
          </div>
        )}
        
        {clients.length > 0 && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActiveView('lista')}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={iniciarCampanha}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center"
              disabled={clients.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Campanha
            </button>
          </div>
        )}
        
        {clients.length > 0 && (
          <div className="flex justify-end space-x-3 mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center"
              onClick={() => {
                if (clients.length === 0) {
                  alert('Por favor, importe os clientes primeiro.');
                  return;
                }

                // Iterate through clients and call the API for each one
                clients.forEach(cliente => {
                  fetch('https://santanacred-n8n-chatwoot.igxlaz.easypanel.host/webhook/consulta', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cpf: cliente.CPF }) // Assuming CPF is the correct field name
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log('API Response:', data);
                    // Handle the API response here
                  })
                  .catch(error => {
                    console.error('API Error:', error);
                    // Handle the error here
                  });
                });

                alert('Consultas iniciadas para todos os clientes!');
              }}
            >
              Iniciar Consultas
            </button>
          </div>
        )}
      </div>
    </>
  );
  
  const renderDetalhesCampanha = () => {
    if (!selectedCampanha) {
      return <div>Campanha não selecionada.</div>;
    }

    return (
      <>
        <div className="mb-6 flex items-center">
          <button
            onClick={() => setActiveView('lista')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← Voltar
          </button>
          <h2 className="text-xl font-medium text-gray-800">{selectedCampanha.nome}</h2>
          <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            {selectedCampanha.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total de CPFs</div>
            <div className="text-2xl font-bold text-gray-800">{selectedCampanha.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Com Saldo</div>
            <div className="text-2xl font-bold text-green-600">
              {detalheCampanha.resultados.filter(r => r.status === 'com_saldo').length}
              <span className="text-sm text-gray-500 font-normal">
                ({Math.round((detalheCampanha.resultados.filter(r => r.status === 'com_saldo').length / selectedCampanha.total) * 100)}%)
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Sem Saldo</div>
            <div className="text-2xl font-bold text-gray-600">
              {detalheCampanha.resultados.filter(r => r.status === 'sem_saldo').length}
              <span className="text-sm text-gray-500 font-normal">
                ({Math.round((detalheCampanha.resultados.filter(r => r.status === 'sem_saldo').length / selectedCampanha.total) * 100)}%)
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Erro</div>
            <div className="text-2xl font-bold text-red-600">
              {detalheCampanha.resultados.filter(r => r.status === 'erro').length}
              <span className="text-sm text-gray-500 font-normal">
                ({Math.round((detalheCampanha.resultados.filter(r => r.status === 'erro').length / selectedCampanha.total) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Resultados da Campanha</h3>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md" title="Filtrar">
                <Filter className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md" title="Exportar">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultationLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.status === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.data}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.hora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };
  
  // Renderiza o conteúdo principal com base na view ativa
  const renderContent = () => {
    switch (activeView) {
      case 'lista':
        return renderListaCampanhas();
      case 'nova':
        return renderNovaCampanha();
      case 'detalhes':
        return renderDetalhesCampanha();
      default:
        return renderListaCampanhas();
    }
  };
  
  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default Campanhas;
