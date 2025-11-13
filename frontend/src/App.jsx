import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';

// PURANE Toaster ko hatayein aur naye ToSonner ko import karein
import { Toaster as ToSonner } from '@/components/ui/sonner';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </main>
      
      {/* Yahan <Toaster /> ki jagah <ToSonner /> use karein */}
      <ToSonner />
    </Router>
  );
}

export default App;