import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function PropostaForm() {
  const [formData, setFormData] = useState({
    cpf: "",
    banco: "",
    data_nascimento: "",
    sexo: "",
    telefone: "",
    email: "",
    cidade_natural: "",
    estado_natural: "",
    nome_mae: "",
    nome_pai: "",
    documento_tipo: "",
    documento_numero: "",
    documento_estado: "",
    documento_data_emissao: "",
    documento_orgao_emissor: "",
    endereco_ruaav: "",
    endereco_numero_residencia: "",
    endereco_complemento: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",
    banco_codigo: "",
    banco_agencia: "",
    banco_conta: "",
    banco_digito_conta: "",
    id_do_simulador: "",
    id_da_tabela: "",
    endereco_cep: "",
    banco_tipo_conta: "",
    contato_celular: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const bancos = [
    { id: "facta", nome: "Facta" },
    { id: "pan", nome: "Banco Pan" },
    { id: "bmg", nome: "Banco BMG" },
    { id: "ole", nome: "Banco Olé" },
    { id: "bradesco", nome: "Bradesco" },
    { id: "itau", nome: "Itaú" },
    { id: "santander", nome: "Santander" }
  ];

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const tiposDocumento = ["RG", "CNH", "Passaporte", "Carteira de Trabalho"];
  const tiposConta = [
    { id: "c", nome: "Conta Corrente" },
    { id: "p", nome: "Conta Poupança" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); // Clear any previous errors
    
    try {
      const response = await fetch('https://n8n-queue-2-n8n-webhook.igxlaz.easypanel.host/webhook/proposta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar a proposta.');
      }

      setSuccess(true);
      // Reset after showing success
      setTimeout(() => setSuccess(false), 3000);
      setFormData({
        cpf: "",
        banco: "",
        data_nascimento: "",
        sexo: "",
        telefone: "",
        email: "",
        cidade_natural: "",
        estado_natural: "",
        nome_mae: "",
        nome_pai: "",
        documento_tipo: "",
        documento_numero: "",
        documento_estado: "",
        documento_data_emissao: "",
        documento_orgao_emissor: "",
        endereco_ruaav: "",
        endereco_numero_residencia: "",
        endereco_complemento: "",
        endereco_bairro: "",
        endereco_cidade: "",
        endereco_estado: "",
        banco_codigo: "",
        banco_agencia: "",
        banco_conta: "",
        banco_digito_conta: "",
        id_do_simulador: "",
        id_da_tabela: "",
        endereco_cep: "",
        banco_tipo_conta: "",
        contato_celular: ""
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Digitação de Proposta</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seleção de Banco */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Escolha do Banco</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bancos.map(banco => (
              <div key={banco.id} className="relative">
                <input
                  type="radio"
                  id={banco.id}
                  name="banco"
                  value={banco.id}
                  className="peer absolute opacity-0 h-full w-full cursor-pointer"
                  onChange={handleChange}
                  required
                />
                <label
                  htmlFor={banco.id}
                  className="flex items-center justify-center p-4 bg-white border rounded-lg shadow-sm peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:ring-2 peer-checked:ring-blue-500 cursor-pointer transition-all"
                >
                  {banco.nome}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Dados Pessoais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                placeholder="000.000.000-00"
                required
              />
            </div>
            
            <div>
              <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                placeholder="exemplo@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            
            <div>
              <label htmlFor="contato_celular" className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input
                type="tel"
                id="contato_celular"
                name="contato_celular"
                value={formData.contato_celular}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            
            <div>
              <label htmlFor="nome_mae" className="block text-sm font-medium text-gray-700 mb-1">Nome da Mãe</label>
              <input
                type="text"
                id="nome_mae"
                name="nome_mae"
                value={formData.nome_mae}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="nome_pai" className="block text-sm font-medium text-gray-700 mb-1">Nome do Pai</label>
              <input
                type="text"
                id="nome_pai"
                name="nome_pai"
                value={formData.nome_pai}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
              />
            </div>
            
            <div>
              <label htmlFor="cidade_natural" className="block text-sm font-medium text-gray-700 mb-1">Cidade Natal</label>
              <input
                type="text"
                id="cidade_natural"
                name="cidade_natural"
                value={formData.cidade_natural}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="estado_natural" className="block text-sm font-medium text-gray-700 mb-1">Estado Natal</label>
              <select
                id="estado_natural"
                name="estado_natural"
                value={formData.estado_natural}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Documento */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Documento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="documento_tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <select
                id="documento_tipo"
                name="documento_tipo"
                value={formData.documento_tipo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                {tiposDocumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="documento_numero" className="block text-sm font-medium text-gray-700 mb-1">Número do Documento</label>
              <input
                type="text"
                id="documento_numero"
                name="documento_numero"
                value={formData.documento_numero}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="documento_orgao_emissor" className="block text-sm font-medium text-gray-700 mb-1">Órgão Emissor</label>
              <input
                type="text"
                id="documento_orgao_emissor"
                name="documento_orgao_emissor"
                value={formData.documento_orgao_emissor}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="documento_estado" className="block text-sm font-medium text-gray-700 mb-1">Estado Emissor</label>
              <select
                id="documento_estado"
                name="documento_estado"
                value={formData.documento_estado}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="documento_data_emissao" className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
              <input
                type="date"
                id="documento_data_emissao"
                name="documento_data_emissao"
                value={formData.documento_data_emissao}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Endereço */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Endereço</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="endereco_cep" className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                id="endereco_cep"
                name="endereco_cep"
                value={formData.endereco_cep}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                placeholder="00000-000"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="endereco_ruaav" className="block text-sm font-medium text-gray-700 mb-1">Rua/Avenida</label>
              <input
                type="text"
                id="endereco_ruaav"
                name="endereco_ruaav"
                value={formData.endereco_ruaav}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endereco_numero_residencia" className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                id="endereco_numero_residencia"
                name="endereco_numero_residencia"
                value={formData.endereco_numero_residencia}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endereco_complemento" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                id="endereco_complemento"
                name="endereco_complemento"
                value={formData.endereco_complemento}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
              />
            </div>
            
            <div>
              <label htmlFor="endereco_bairro" className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                id="endereco_bairro"
                name="endereco_bairro"
                value={formData.endereco_bairro}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endereco_cidade" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                id="endereco_cidade"
                name="endereco_cidade"
                value={formData.endereco_cidade}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="endereco_estado" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                id="endereco_estado"
                name="endereco_estado"
                value={formData.endereco_estado}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Dados Bancários */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Dados Bancários</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="banco_codigo" className="block text-sm font-medium text-gray-700 mb-1">Código do Banco</label>
              <input
                type="text"
                id="banco_codigo"
                name="banco_codigo"
                value={formData.banco_codigo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="banco_tipo_conta" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
              <select
                id="banco_tipo_conta"
                name="banco_tipo_conta"
                value={formData.banco_tipo_conta}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              >
                <option value="">Selecione</option>
                {tiposConta.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="banco_agencia" className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
              <input
                type="text"
                id="banco_agencia"
                name="banco_agencia"
                value={formData.banco_agencia}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="banco_conta" className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <input
                type="text"
                id="banco_conta"
                name="banco_conta"
                value={formData.banco_conta}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="banco_digito_conta" className="block text-sm font-medium text-gray-700 mb-1">Dígito</label>
              <input
                type="text"
                id="banco_digito_conta"
                name="banco_digito_conta"
                value={formData.banco_digito_conta}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Detalhes da Proposta */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Detalhes da Proposta</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="id_do_simulador" className="block text-sm font-medium text-gray-700 mb-1">ID do Simulador</label>
              <input
                type="text"
                id="id_do_simulador"
                name="id_do_simulador"
                value={formData.id_do_simulador}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <div>
              <label htmlFor="id_da_tabela" className="block text-sm font-medium text-gray-700 mb-1">ID da Tabela</label>
              <input
                type="text"
                id="id_da_tabela"
                name="id_da_tabela"
                value={formData.id_da_tabela}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-300 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {/* Botão de Envio */}
        <div className="flex justify-center">
          <button
            type="submit"
            className={`
              px-8 py-4 rounded-lg text-lg font-medium shadow-md
              transition-all duration-300 transform
              ${submitting || success 
                ? 'cursor-default' 
                : 'hover:scale-105 active:scale-95 hover:shadow-lg'}
              ${success 
                ? 'bg-green-500 text-white' 
                : submitting 
                  ? 'bg-blue-300 text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
            `}
            disabled={submitting || success}
          >
            {submitting ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin mr-2" size={20} />
                Processando...
              </span>
            ) : success ? (
              <span className="flex items-center">
                <Check className="mr-2" size={20} />
                Proposta Enviada!
              </span>
            ) : (
              "Enviar Proposta"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
