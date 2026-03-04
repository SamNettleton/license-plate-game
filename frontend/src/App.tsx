import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, ThemeProvider, useColorScheme, CssBaseline } from '@components';
import { theme } from './material-ui/Theme';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Practice from '@/pages/Practice';
import Daily from '@/pages/Daily';
import Header from './components/Header';

function App() {
  const queryClient = new QueryClient();

  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AppContent></AppContent>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function AppContent() {
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
        <Header />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/practice" element={<Practice />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
