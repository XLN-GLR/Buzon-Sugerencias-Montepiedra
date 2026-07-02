import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Board from './pages/Board';
import SuggestionForm from './pages/SuggestionForm';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes inside Layout to share Header, Footer and Navbar structure */}
        <Route path="/" element={<Layout />}>
          {/* Main Suggestions Board */}
          <Route index element={<Board />} />
          
          {/* Form to submit new suggestions */}
          <Route path="nueva-sugerencia" element={<SuggestionForm />} />
          
          {/* Administration Dashboard */}
          <Route path="admin" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
