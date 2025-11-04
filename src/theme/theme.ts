'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5FB3A7',      // Deep navy blue - main brand color
      light: '#BADFDB',     // Light blue for hover states
      dark: '#3D8B80',      // Darker navy
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF4F0F',      // Teal green - accent color
      light: '#B0DB9C',     // Lighter teal
      dark: '#6FA03A',      // Darker teal
      contrastText: '#fff',
    },
    error: {
      main: '#d72d2dff',      // Magenta for errors/warnings
      light: '#FFBDBD',
      dark: '#E57373',
      contrastText: '#fff',
    },
    warning: {
      main: '#5D688A',      // Warm orange
      light: '#6d86d3ff',
      dark: '#899fe1ff',
      contrastText: '#fff',
    },
    success: {
      main: '#450693',      // Medium green (from #CAE8BD)
      light: '#CAE8BD',     // Pale green
      dark: '#5FA05D',      // Darker green
      contrastText: '#fff',
    },
    background: {
      default: '#ffffff',   // Cream background
      paper: '#03a79121',     // White for cards/papers
    },
    text: {
      primary: '#2C3E50',   // Dark blue-gray for readability
      secondary: '#6C757D', // Medium gray
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#03A791', // Soft teal appbar
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#9baec0ff',
          color: '#0C2B4E',
        },
        colorSuccess: {
          backgroundColor: '#4C763B',
          color: '#fff',
        },
        colorWarning: {
          backgroundColor: '#eb0909ff',
          color: '#fff',
        },
        colorSecondary: {
          backgroundColor: '#FF4F0F',
          color: '#fff',
        },
      },
    },
  },
});

export default theme;