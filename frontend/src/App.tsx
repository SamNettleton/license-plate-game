import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IconButton, Mode, ThemeProvider, useColorScheme, CssBaseline } from '@components';
import { LightModeIcon, DarkModeIcon } from '@icons';
import { theme } from './material-ui/Theme';

import Home from '@/pages/Home';
import About from '@/pages/About';
import Practice from '@/pages/Practice';

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
  const { mode, setMode } = useColorScheme();
  if (!mode) {
    return null;
  }

  return (
    <Router>
      <div>{renderThemeIcon(mode, setMode)}</div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </Router>
  );
}

function renderThemeIcon(mode: string, setMode: (theme: Mode) => void) {
  return mode == 'light' ? (
    <IconButton aria-label="dark mode" onClick={() => toggleTheme(mode, setMode)}>
      <DarkModeIcon />
    </IconButton>
  ) : (
    <IconButton aria-label="light mode" onClick={() => toggleTheme(mode, setMode)}>
      <LightModeIcon />
    </IconButton>
  );
}

function toggleTheme(mode: string, setMode: (theme: Mode) => void) {
  const newMode = mode == 'light' ? 'dark' : 'light';
  setMode(newMode);
}

export default App;
