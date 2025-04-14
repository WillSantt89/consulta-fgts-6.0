import React, { useState } from 'react';
import { 
  Save, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Calculator, 
  Calendar, 
  CreditCard,
  Banknote,
  Building
} from 'lucide-react';

interface FormData {
  banco: string;
  cliente: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  valor: string;
  prazo: string;
  taxa: string;
  observacoes: string;
}

const bancos = [
  { id: 'FACTA', nome: 'FACTA' },
  { id: 'VCTEX', nome: 'VCTEX' },
  { id: 'ICRED', nome: 'ICRED' },
  { id: 'BMG', nome: 'BMG' },
  { id: 'MERCANTIL', nome: 'MERCANTIL' }
];

const DigitarProposta: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    banco: '',
    cliente: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    valor: '',
    prazo: '',
    taxa: '',
    observacoes: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formatar CPF
  const formatCPF = (value: string): string => {
    const cpfClean = value.replace(/\D/g, '');
    
    if (cpfClean.length <= 11) {
      return cpfClean
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return value;
  };
  
  // Formatar telefone
  const formatTelefone = (value: string): string => {
    const telefoneClean = value.replace(/\D/g, '');
    
    if (telefoneClean.length <= 11) {
      return telefoneClean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    return value;
  };
  
  // Formatar valor monetário
  const formatValor = (value: string): string => {
    const valorClean = value.replace(/\D/g, '');
    
    if (valorClean) {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(valorClean) / 100);
    }
    
    return value;
  };

  // Lidar com mudanças nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Aplicar formatações específicas
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'telefone') {
      formattedValue = formatTelefone(value);
    } else if (name === 'valor') {
      formattedValue = formatValor(value);
    }
    
    setFormData({
      ...formData,
      [name]: formattedValue
    });
  };

  // Enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.banco || !formData.cliente || !formData.cpf || !formData.dataNascimento || !formData.valor) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      // Simulação de envio para uma API (substitua por uma chamada real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Dados da proposta:', formData);
      
      // Simular sucesso
      setSuccessMessage('Proposta cadastrada com sucesso!');
      
      // Limpar o formulário
      setFormData({
        banco: '',
        cliente: '',
        cpf: '',
        dataNascimento: '',
        telefone: '',
        valor: '',
        prazo: '',
        taxa: '',
        observacoes: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      setErrorMessage('Ocorreu um erro ao salvar a proposta. Tente novamente mais tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-800">Digitar Proposta</h2>
          <div className="flex items-center text-sm text-gray-500">
            <UserPlus className="w-4 h-4 mr-1" />
            Nova Proposta
          </div>
        </div>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Seletor de Banco */}
            <div>
              <label htmlFor="banco" className="block text-sm font-medium text-gray-700 mb-1">
                Banco <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="banco"
                  name="banco"
                  value={formData.banco}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Selecione o banco</option>
                  {bancos.map(banco => (
                    <option key={banco.id} value={banco.id}>{banco.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Dados do Cliente */}
            <div>
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cliente"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>
            </div>
            
            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
            
            {/* Data de Nascimento */}
            <div>
              <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="(00) 00000-0000"
              />
            </div>
            
            {/* Valor */}
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Proposta <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Banknote className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="valor"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            
            {/* Prazo */}
            <div>
              <label htmlFor="prazo" className="block text-sm font-medium text-gray-700 mb-1">
                Prazo (meses)
              </label>
              <input
                type="number"
                id="prazo"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ex: 12, 24, 36..."
                min="1"
              />
            </div>
            
            {/* Taxa */}
            <div>
              <label htmlFor="taxa" className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de Juros (% a.m.)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calculator className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="taxa"
                  name="taxa"
                  value={formData.taxa}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: 1,99"
                />
              </div>
            </div>
          </div>
          
          {/* Observações */}
          <div className="mb-6">
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Informações adicionais sobre a proposta..."
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <>
                  <CheckCircle className="animate-pulse mr-2 h-5 w-5" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Proposta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DigitarProposta;
