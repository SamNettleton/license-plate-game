import * as React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, ThemeProvider, useColorScheme, CssBaseline } from '@components';
import { theme } from './material-ui/Theme';
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Practice from '@/pages/Practice';
import Daily from '@/pages/Daily';
import Header from './components/Header';
import { SettingsProvider } from '@/context/SettingsContext';

export const faro = initializeFaro({
  url: import.meta.env.VITE_FARO_URL || '',
  app: {
    name: 'license-plate-frontend',
    version: '1.0.0',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  },
  instrumentations: [
    ...getWebInstrumentations({
      captureConsole: true,
    }),
  ],
});

const queryClient = new QueryClient();

function App() {
  const [resultsOpen, setResultsOpen] = React.useState(false);

  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent resultsOpen={resultsOpen} setResultsOpen={setResultsOpen} />
        </QueryClientProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

function AppContent({
  resultsOpen,
  setResultsOpen,
}: {
  resultsOpen: boolean;
  setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { mode } = useColorScheme();
  if (!mode) {
    return null;
  }

  return (
    <Router>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        <Header resultsOpen={resultsOpen} setResultsOpen={setResultsOpen} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/daily" element={<Daily resultsOpen={resultsOpen} />} />
            <Route path="/practice" element={<Practice resultsOpen={resultsOpen} />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
