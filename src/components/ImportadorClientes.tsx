import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import Papa from 'papaparse';

interface Cliente {
  CPF: string;
  CLIENTE_NOME?: string;
  CLIENTE_CELULAR?: string;
  [key: string]: any;
}

interface ImportadorClientesProps {
  onClientesImportados: (clientes: Cliente[]) => void;
}

const ImportadorClientes: React.FC<ImportadorClientesProps> = ({ onClientesImportados }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setValidationErrors([]);
      parseFile(selectedFile);
    }
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    const validExtensions = ['.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Formato de arquivo inválido. Por favor, envie um arquivo CSV.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo é muito grande. O tamanho máximo permitido é 5MB.');
      return false;
    }

    return true;
  }, []);

  const parseFile = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsUploading(false);

        const headers = results.meta.fields || [];
        if (!headers.some(header => header === 'CPF' || header === 'cpf' || header === 'Cpf' || header === 'CPF_CLIENTE')) {
          setError('O arquivo CSV não possui uma coluna de CPF. Por favor, verifique o formato do arquivo.');
          return;
        }

        const errors: string[] = [];
        const validatedData = results.data.filter((row: any, index: number) => {
          const cpfColumn = Object.keys(row).find(key => key === 'CPF' || key === 'cpf' || key === 'Cpf' || key === 'CPF_CLIENTE');

          if (!cpfColumn || !row[cpfColumn]) {
            errors.push(`Linha ${index + 2}: CPF não encontrado ou vazio`);
            return false;
          }

          const cpf = row[cpfColumn].toString().replace(/[^\d]/g, '');
          if (cpf.length !== 11) {
            errors.push(`Linha ${index + 2}: CPF inválido (deve ter 11 dígitos): ${row[cpfColumn]}`);
            return false;
          }

          return true;
        });

        setParsedData(validatedData);
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
  }, [validateFile]);

  const handleImport = useCallback(() => {
    if (parsedData.length === 0) {
      setError('Não há dados válidos para importar.');
      return;
    }

    onClientesImportados(parsedData as Cliente[]);
  }, [onClientesImportados, parsedData]);

  const handleReset = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setValidationErrors([]);
    setIsUploading(false);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Importar Clientes do Arquivo</h3>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Selecione um arquivo CSV contendo uma lista de clientes para importar.
          O arquivo deve conter uma coluna com o título "CPF" contendo os números de CPF a serem importados.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
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
                {parsedData.length} clientes válidos encontrados no arquivo.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleImport}
          disabled={parsedData.length === 0 || isUploading}
          className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            parsedData.length === 0 || isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Enviando arquivo...
            </>
          ) : (
            'Importar Clientes'
          )}
        </button>
      </div>
    </div>
  );
};

export default ImportadorClientes;
