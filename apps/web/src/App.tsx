import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/CatalogPage';
import { EstimatesPage } from './pages/EstimatesPage';
import { EstimateReportPage } from './pages/EstimateReportPage';
import { CostProfilePage } from './pages/CostProfilePage';
import { CostProfileReportPage } from './pages/CostProfileReportPage';
import { AppShell } from './components/layout/AppShell';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/estimates/:id/report" element={<EstimateReportPage />} />
          <Route path="/settings" element={<CostProfilePage />} />
          <Route path="/settings/report" element={<CostProfileReportPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
