import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Site from './Site.jsx';
import './styles.css';

const Admin = lazy(() => import('./admin/Admin.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Site />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
