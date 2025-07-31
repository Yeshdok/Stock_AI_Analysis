import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#0a0e1a',
      paper: '#1a1d29',
    },
    surface: {
      main: '#252836',
      light: '#2d3142',
      dark: '#1e2028',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b3b8',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", "Microsoft YaHei", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ffffff',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          padding: '12px 24px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 4px 12px rgba(144, 202, 249, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(144, 202, 249, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          borderRadius: 0,
          backgroundColor: '#1a1d29',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#252836',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: '#252836',
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(144, 202, 249, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#90caf9',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b3b8',
            '&.Mui-focused': {
              color: '#90caf9',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#252836',
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(144, 202, 249, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#90caf9',
            },
          },
        },
        paper: {
          backgroundColor: '#252836',
          border: '1px solid rgba(255,255,255,0.1)',
        },
        option: {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(144, 202, 249, 0.1)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(144, 202, 249, 0.2)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#252836',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
        },
        colorPrimary: {
          backgroundColor: 'rgba(144, 202, 249, 0.2)',
          color: '#90caf9',
          border: '1px solid rgba(144, 202, 249, 0.3)',
        },
        colorSecondary: {
          backgroundColor: 'rgba(206, 147, 216, 0.2)',
          color: '#ce93d8',
          border: '1px solid rgba(206, 147, 216, 0.3)',
        },
        colorSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          color: '#4caf50',
          border: '1px solid rgba(76, 175, 80, 0.3)',
        },
        colorError: {
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          color: '#f44336',
          border: '1px solid rgba(244, 67, 54, 0.3)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        standardError: {
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: '#f44336',
          border: '1px solid rgba(244, 67, 54, 0.3)',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          color: '#ff9800',
          border: '1px solid rgba(255, 152, 0, 0.3)',
        },
        standardInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          color: '#2196f3',
          border: '1px solid rgba(33, 150, 243, 0.3)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          color: '#4caf50',
          border: '1px solid rgba(76, 175, 80, 0.3)',
        },
      },
    },
  },
});

export default theme; 