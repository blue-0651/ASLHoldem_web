import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TournamentManagement from './pages/TournamentManagement';
import StoreManagement from './pages/StoreManagement';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tournaments" element={<TournamentManagement />} />
          <Route path="stores" element={<StoreManagement />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App; 