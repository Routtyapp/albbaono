// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import { Layout } from './components/common';
import { DashboardLayout } from './components/dashboard';
import { Landing } from './pages';
import { Brands, PerformancePage, QueryOpsPage, ReportsInsightsPage, ScorePage, SchedulerPage } from './pages/dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page with original layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <Landing />
                </Layout>
              }
            />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard routes with dashboard layout (protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* New primary routes */}
              <Route index element={<Navigate to="/dashboard/performance?tab=overview" replace />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="query-ops" element={<QueryOpsPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="brands" element={<Brands />} />
              <Route path="reports" element={<ReportsInsightsPage />} />
              <Route path="score" element={<ScorePage />} />

              {/* Legacy route redirects */}
              <Route path="visibility" element={<Navigate to="/dashboard/performance?tab=visibility" replace />} />
              <Route path="queries" element={<Navigate to="/dashboard/query-ops?tab=queries" replace />} />
              <Route path="insights" element={<Navigate to="/dashboard/reports?tab=insights" replace />} />
              <Route path="score/analysis" element={<Navigate to="/dashboard/score?tab=technical" replace />} />
              <Route path="score/competitors" element={<Navigate to="/dashboard/score?tab=competitors" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}
