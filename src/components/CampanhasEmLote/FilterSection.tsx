import React from 'react';
import { Search, Filter } from 'lucide-react';
import { FiltrosState } from '../../types';

interface FilterSectionProps {
  filtros: FiltrosState;
  mostrarFiltros: boolean;
  setMostrarFiltros: (mostrar: boolean) => void;
  handleFilterChange: (newFiltros: Partial<FiltrosState>) => void;
  limparFiltros: () => void;
  bancosDisponiveis: string[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filtros,
  mostrarFiltros,
  setMostrarFiltros,
  handleFilterChange,
  limparFiltros,
  bancosDisponiveis,
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filtros
        </button>
      </div>

      {mostrarFiltros && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">Filtrar Mensagens</h3>
            <button
              onClick={limparFiltros}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => handleFilterChange({ status: e.target.value as any })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendentes</option>
                <option value="enviado">Enviados</option>
                <option value="erro">Com Erro</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Banco
              </label>
              <select
                value={filtros.banco}
                onChange={(e) => handleFilterChange({ banco: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Todos</option>
                {bancosDisponiveis.map((banco, index) => (
                  <option key={index} value={banco}>{banco}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Valor Mínimo
              </label>
              <input
                type="number"
                value={filtros.valorMinimo}
                onChange={(e) => handleFilterChange({ valorMinimo: parseFloat(e.target.value) || 0 })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                min="0"
                step="100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar (CPF/Nome)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filtros.busca}
                  onChange={(e) => handleFilterChange({ busca: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pl-8"
                  placeholder="Buscar..."
                />
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSection;
