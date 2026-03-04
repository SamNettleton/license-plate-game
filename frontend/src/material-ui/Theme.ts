import { createTheme } from '@components';

export const theme = createTheme({
  defaultColorScheme: 'dark',
  cssVariables: {
    colorSchemeSelector: 'class', // Or 'data'
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: '#e4f0e2',
          paper: '#ffffff',
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: '#0a0a0a',
          paper: '#121212',
        },
      },
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          textTransform: 'none',
        },
      },
    },
  },
});
