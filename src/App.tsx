import React, { useState } from 'react';
import { BarChart, User, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ConsultaIndividual from './components/ConsultaIndividual';
// import Campanhas from './components/Campanhas'; // Removed import

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Função para renderizar o conteúdo da aba ativa
  const renderTabContent = () => {
    switch(activeTab) {
      case 0:
        return <Dashboard />;
      case 1:
        return <ConsultaIndividual />;
      // case 2: // Removed case for Campanhas
      //   return <Campanhas />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Sistema de Consulta FGTS</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
              Ajuda
            </button>
            <div className="flex items-center">
              <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold">
                OP
              </span>
              <span className="ml-2 text-sm font-medium text-gray-700">Operador</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs customizadas */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab(0)}
              className={`px-4 py-2 font-medium text-sm mr-4 cursor-pointer ${
                activeTab === 0 
                  ? 'text-green-600 border-b-2 border-green-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`px-4 py-2 font-medium text-sm mr-4 cursor-pointer ${
                activeTab === 1 
                  ? 'text-green-600 border-b-2 border-green-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Consulta Individual
              </div>
            </button>
            {/* <button // Removed Campanhas tab button
              onClick={() => setActiveTab(2)}
              className={`px-4 py-2 font-medium text-sm cursor-pointer ${
                activeTab === 2 
                  ? 'text-green-600 border-b-2 border-green-500' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Campanhas
              </div>
            </button> */}
          </div>
          
          {/* Conteúdo da aba ativa */}
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
