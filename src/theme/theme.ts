import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f74c0'
    },
    secondary: {
      main: '#ff5c8d'
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;
