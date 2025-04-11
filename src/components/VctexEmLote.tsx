import React, { useState, useRef, useEffect } from 'react';
    import { Upload, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw, Code } from 'lucide-react';
    import Papa from 'papaparse';

    interface ClienteCSV {
      nome: string;
      cpf: string;
      telefone: string;
      status: string;
    }

    interface CpfPayload {
      cpf: string[];
    }

    const VctexEmLote: React.FC = () => {
      const [file, setFile] = useState<File | null>(null);
      const [isUploading, setIsUploading] = useState(false);
      const [isSending, setIsSending] = useState(false);
      const [successMessage, setSuccessMessage] = useState<string | null>(null);
      const [parsedData, setParsedData] = useState<ClienteCSV[]>([]);
      const [error, setError] = useState<string | null>(null);
      const [validationErrors, setValidationErrors] = useState<string[]>([]);
      const [filteredClientes, setFilteredClientes] = useState<string[]>([]);
      const [cpfPayload, setCpfPayload] = useState<CpfPayload | null>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);

      // Função para validar o formato do arquivo
      const validateFile = (file: File): boolean => {
        // Verifica se é um arquivo CSV
        const validExtensions = ['.csv'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
          setError('Formato de arquivo inválido. Por favor, envie um arquivo CSV.');
          return false;
        }

        // Verifica o tamanho do arquivo (limite de 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
          return false;
        }

        return true;
      };

      // Função para formatar o CPF (remover caracteres não numéricos e garantir 11 dígitos)
      const formatarCPF = (cpf: string): string => {
        const cpfLimpo = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
        return cpfLimpo.padStart(11, '0').slice(0, 11); // Adiciona zeros à esquerda e garante 11 dígitos
      };

      // Função para lidar com o upload do arquivo
      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const selectedFile = e.target.files[0];
          setFile(selectedFile);
          setError(null);
          setValidationErrors([]);
          setSuccessMessage(null);

          // Analisa o arquivo
          parseFile(selectedFile);
        }
      };

      // Função para analisar o arquivo CSV
      const parseFile = (file: File) => {
        if (!validateFile(file)) return;

        setIsUploading(true);
        setError(null);

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setIsUploading(false);

            // Verificar se o CSV tem as colunas necessárias
            const headers = results.meta.fields || [];
            const requiredFields = ['nome', 'cpf', 'telefone', 'status'];
            
            // Verifica se existem as colunas necessárias (case insensitive)
            const missingFields = requiredFields.filter(field => 
              !headers.some(header => header.toLowerCase() === field.toLowerCase())
            );

            if (missingFields.length > 0) {
              setError(`O arquivo CSV não possui as colunas necessárias. Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
              return;
            }

            // Validar o conteúdo do CSV
            const errors: string[] = [];
            const validatedData: ClienteCSV[] = [];
            
            results.data.forEach((row: any, index: number) => {
              // Encontrar as colunas no CSV (case insensitive)
              const cpfColumn = Object.keys(row).find(key => key.toLowerCase() === 'cpf');
              const nomeColumn = Object.keys(row).find(key => key.toLowerCase() === 'nome');
              const telefoneColumn = Object.keys(row).find(key => key.toLowerCase() === 'telefone');
              const statusColumn = Object.keys(row).find(key => key.toLowerCase() === 'status');

              if (!cpfColumn || !row[cpfColumn]) {
                errors.push(`Linha ${index + 2}: CPF não encontrado ou vazio`);
                return;
              }

              if (!statusColumn || !row[statusColumn]) {
                errors.push(`Linha ${index + 2}: Status não encontrado ou vazio`);
                return;
              }

              // Formatar o CPF (remover caracteres não numéricos e garantir 11 dígitos)
              const cpfFormatado = formatarCPF(row[cpfColumn]);
              
              // Validar o CPF (11 dígitos)
              if (cpfFormatado.length !== 11) {
                errors.push(`Linha ${index + 2}: CPF inválido (${row[cpfColumn]}), deve ter 11 dígitos após a remoção de caracteres não numéricos`);
                return;
              }

              // Adicionar o cliente validado
              validatedData.push({
                nome: nomeColumn ? row[nomeColumn] || '' : '',
                cpf: cpfFormatado,
                telefone: telefoneColumn ? row[telefoneColumn] || '' : '',
                status: row[statusColumn]
              });
            });

            setParsedData(validatedData);
            setValidationErrors(errors);

            // Se tiver mais de 20% de erros, mostrar um aviso
            if (errors.length > 0 && errors.length / results.data.length > 0.2) {
              setError(`O arquivo contém ${errors.length} erros de um total de ${results.data.length} registros. Verifique o formato do arquivo.`);
            }
          },
          error: (err) => {
            setIsUploading(false);
            setError(`Erro ao processar o arquivo CSV: ${err.message}`);
          }
        });
      };

      // Efeito para filtrar os clientes com status "pendente" sempre que os dados mudam
      useEffect(() => {
        if (parsedData.length > 0) {
          // Filtrar clientes com status "pendente" (case insensitive)
          const clientesPendentes = parsedData
            .filter(cliente => cliente.status.toLowerCase() === 'pendente')
            .map(cliente => cliente.cpf);

          setFilteredClientes(clientesPendentes);

          // Criar o objeto JSON no formato esperado
          if (clientesPendentes.length > 0) {
            setCpfPayload({ cpf: clientesPendentes });
          } else {
            setCpfPayload(null);
          }
        } else {
          setFilteredClientes([]);
          setCpfPayload(null);
        }
      }, [parsedData]);

      // Função para limpar o formulário
      const handleReset = () => {
        setFile(null);
        setParsedData([]);
        setFilteredClientes([]);
        setCpfPayload(null);
        setError(null);
        setValidationErrors([]);
        setIsUploading(false);
        setIsSending(false);
        setSuccessMessage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      // Função para enviar os dados para a API de cadastro
      const handleImport = async () => {
        if (parsedData.length === 0) {
          setError('Não há dados válidos para importar.');
          return;
        }

        setIsSending(true);
        setError(null);
        setSuccessMessage(null);

        try {
          // Enviar os dados para a API de cadastro
          const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/cadastro/clientes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(parsedData)
          });

          if (!response.ok) {
            throw new Error(`Erro ao cadastrar clientes: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Resposta da API:', data);
          
          // Definir mensagem de sucesso
          setSuccessMessage(`Dados cadastrados com sucesso! ${parsedData.length} registros foram enviados.`);

        } catch (error) {
          console.error('Erro ao enviar dados para API:', error);
          setError(error instanceof Error ? error.message : 'Erro ao cadastrar os clientes. Tente novamente mais tarde.');
        } finally {
          setIsSending(false);
        }
      };

      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              VCTEX Em Lote
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Faça o upload de um arquivo CSV contendo os campos <strong>nome</strong>, <strong>cpf</strong>, <strong>telefone</strong> e <strong>status</strong>.
                Os registros com status <strong>"pendente"</strong> serão enviados para consulta em lote no VCTEX.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv"
                />

                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arraste e solte seu arquivo aqui, ou
                  </p>
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    Selecionar Arquivo
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Formato suportado: CSV - Máx. 5MB
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
                        {(file.size / 1024).toFixed(2)} KB - {parsedData.length} registros
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
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
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
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Prévia dos dados</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedData.slice(0, 5).map((cliente, index) => (
                          <tr key={index} className={cliente.status.toLowerCase() === 'pendente' ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-2 text-sm">{cliente.nome || '-'}</td>
                            <td className="px-4 py-2 text-sm">{cliente.cpf}</td>
                            <td className="px-4 py-2 text-sm">{cliente.telefone || '-'}</td>
                            <td className="px-4 py-2 text-sm">
                              {cliente.status.toLowerCase() === 'pendente' ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  Pendente
                                </span>
                              ) : (
                                cliente.status
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 5 && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Mostrando 5 de {parsedData.length} registros
                      </div>
                    )}
                  </div>
                  
                  {validationErrors.length === 0 && parsedData.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p className="text-sm">{parsedData.length} registros válidos encontrados no arquivo.</p>
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p className="text-sm">{successMessage}</p>
                    </div>
                  )}
                  
                  {/* Exibir a estrutura JSON de CPFs com status "pendente" */}
                  {successMessage && cpfPayload && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-700">CPFs com status "pendente"</h3>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {filteredClientes.length} CPFs
                        </span>
                      </div>
                      <div className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                        <div className="flex items-center mb-2">
                          <Code className="h-4 w-4 mr-2" />
                          <span className="text-gray-400 text-xs">Payload JSON para próxima etapa:</span>
                        </div>
                        <pre>
                          {JSON.stringify(cpfPayload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={parsedData.length === 0 || isUploading || isSending}
                className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  parsedData.length === 0 || isUploading || isSending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Dados'
                )}
              </button>
            </div>
          </div>
        </div>
      );
    };

    export default VctexEmLote;
