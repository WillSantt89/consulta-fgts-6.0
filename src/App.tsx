import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
    import Dashboard from './components/Dashboard';
    import ConsultaIndividual from './components/ConsultaIndividual';
    import ConsultaLote from './components/ConsultaLote';
    import Layout from './components/Layout';
    import HistoricoConsultas from './components/HistoricoConsultas';
    import BuscarClientes from './components/BuscarClientes';
    import VctexEmLote from './components/VctexEmLote';

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
              <Route path="clientes/buscar" element={<BuscarClientes />} />
              {/* Add more routes for other features here */}
            </Route>
          </Routes>
        </Router>
      );
    };

    export default App;
