import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BarChart, User, Users } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Sistema FGTS</h1>
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            <li>
              <Link to="/" className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <BarChart className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/consulta" className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <User className="w-5 h-5 mr-2" />
                Consulta Individual
              </Link>
            </li>
            <li>
              <Link to="/consulta-lote" className="flex items-center px-4 py-2 hover:bg-gray-700 rounded">
                <Users className="w-5 h-5 mr-2" />
                Consulta em Lote
              </Link>
            </li>
            {/* Add more links for other features here */}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
