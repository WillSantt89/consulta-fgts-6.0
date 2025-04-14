import React from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface FileUploadSectionProps {
  file: File | null;
  isUploading: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  validationErrors: string[];
  handleReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  file,
  isUploading,
  handleFileChange,
  error,
  validationErrors,
  handleReset,
  fileInputRef,
}) => {
  return (
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

      {isUploading && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
          <RefreshCw className="animate-spin h-5 w-5 mr-2" />
          <p className="text-sm">Carregando arquivo...</p>
        </div>
      )}

      {/*  Success message is now handled in the main component */}
    </div>
  );
};

export default FileUploadSection;
