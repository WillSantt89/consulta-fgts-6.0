import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ConsultaIndividual from './components/ConsultaIndividual';
import ConsultaLote from './components/ConsultaLote';
import Layout from './components/Layout';
import HistoricoConsultas from './components/HistoricoConsultas';
import BuscarClientes from './components/BuscarClientes';
import VctexEmLote from './components/VctexEmLote';
import VctexProtocolos from './components/VctexProtocolos';
import DigitarProposta from './components/DigitarProposta';
import AcompanhamentoPropostas from './components/AcompanhamentoPropostas';
import FactaApiConfig from './components/FactaApiConfig';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="consulta" element={<ConsultaIndividual />} />
          <Route path="consulta-lote" element={<ConsultaLote />} />
          <Route path="historico-consultas" element={<HistoricoConsultas />} />
          <Route path="vctex-lote" element={<VctexEmLote />} />
          <Route path="vctex-protocolos" element={<VctexProtocolos />} />
          <Route path="clientes/buscar" element={<BuscarClientes />} />
          
          {/* Rotas para Propostas */}
          <Route path="propostas/digitar" element={<DigitarProposta />} />
          <Route path="propostas/acompanhamento" element={<AcompanhamentoPropostas />} />
          
          {/* Rotas para Configurações API */}
          <Route path="configuracoes/facta/cadastro" element={<FactaApiConfig />} />
          
          {/* Add more routes for other features here */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
