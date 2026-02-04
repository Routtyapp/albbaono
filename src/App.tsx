// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { Layout } from './components/common';
import { DashboardLayout } from './components/dashboard';
import { Landing } from './pages';
import { Overview, Brands, Visibility, Queries, Reports, ScoreOverview, ScoreAnalysis, ScoreCompetitors, Insights } from './pages/dashboard';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
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

          {/* Dashboard routes with dashboard layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* GEO Tracker */}
            <Route index element={<Overview />} />
            <Route path="brands" element={<Brands />} />
            <Route path="visibility" element={<Visibility />} />
            <Route path="queries" element={<Queries />} />
            <Route path="reports" element={<Reports />} />
            <Route path="insights" element={<Insights />} />
            {/* GEO Score */}
            <Route path="score" element={<ScoreOverview />} />
            <Route path="score/analysis" element={<ScoreAnalysis />} />
            <Route path="score/competitors" element={<ScoreCompetitors />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
