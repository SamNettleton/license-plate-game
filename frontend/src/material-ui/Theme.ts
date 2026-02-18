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
          default: '#222222',
          paper: '#1e1e1e',
        },
      },
    },
  },

  components: {
    MuiButton: {
      defaultProps: {
        className: 'default-button-class',
        style: {
          borderRadius: '24px',
          textTransform: 'None',
        },
      },
    },
  },
});
