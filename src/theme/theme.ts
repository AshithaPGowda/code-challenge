'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0C2B4E',
      dark: '#1A3D64',
      light: '#1D546C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F4F4F4',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#fffffff',
    },
    success: {
      main: '#22C55E',
      light: '#DCFCE7',
      dark: '#15803D',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#92400E',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#991B1B',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1E40AF',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    h6: { fontWeight: 600, color: '#DBEAFE' },
    body1: { color: '#1A1A1A' },
    body2: { color: '#5A6472' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0C2B4E',
          color: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #E0E0E0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        colorSuccess: {
          backgroundColor: '#DCFCE7',
          color: '#15803D',
        },
        colorWarning: {
          backgroundColor: '#FEF3C7',
          color: '#92400E',
        },
        colorError: {
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
        },
        colorInfo: {
          backgroundColor: '#DBEAFE',
          color: '#1E40AF',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
        },
      },
    },
  },
});

export default theme;
