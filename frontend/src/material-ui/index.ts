/*
This file is used to handle MUI imports for all components used throughout the application,
resulting in cleaner import statements elsewhere.

Use with *absolute path* for clarity, i.e. `import { Button } from 'material-ui';`
*/

export { default as Button } from '@mui/material/Button';
export { default as IconButton } from '@mui/material/IconButton';
export { ThemeProvider, useColorScheme, createTheme } from '@mui/material/styles';
export { default as CssBaseline } from '@mui/material/CssBaseline';
export { default as Box } from '@mui/material/Box';
export { default as Grid } from '@mui/material/Grid';
export { default as TextField } from '@mui/material/TextField';
export { default as Fade } from '@mui/material/Fade';
export type { SupportedColorScheme as Mode } from '@mui/material/styles';
