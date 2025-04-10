import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ConsultaIndividual from './components/ConsultaIndividual';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="consulta" element={<ConsultaIndividual />} />
          {/* Add more routes for other features here */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
