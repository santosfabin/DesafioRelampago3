import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import MainLayout from './components/layout/MainLayout';

import Login from './components/Login';
import Register from './components/Register';
import Logout from './components/Logout';

import LandingPage from './pages/LandingPage';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
import UserProfile from './components/UserProfile';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/login/checkLogin');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuthStatus();
  }, []);

  if (!authChecked) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            element={
              <MainLayout
                isAuthenticated={isAuthenticated}
                setIsAuthenticated={setIsAuthenticated}
              />
            }
          >
            {/* Rotas públicas ou que redirecionam se autenticado */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login setIsAuthenticated={setIsAuthenticated} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />}
            />

            {/* Rotas protegidas - só renderizam se isAuthenticated for true */}
            {isAuthenticated && (
              <>
                <Route path="/" element={<LandingPage />} />
                <Route path="/assets" element={<AssetList />} />
                <Route path="/assets/new" element={<AssetForm />} />
                <Route path="/assets/:id" element={<AssetForm />} />
                <Route path="/assets/:assetId/maintenances" element={<MaintenanceList />} />
                <Route path="/assets/:assetId/maintenances/new" element={<MaintenanceForm />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route
                  path="/assets/:assetId/maintenances/:maintenanceId"
                  element={<MaintenanceForm />}
                />
                <Route
                  path="/logout"
                  element={<Logout setIsAuthenticated={setIsAuthenticated} />}
                />
              </>
            )}
          </Route>

          {/* Se não autenticado e nenhuma rota acima bateu, redireciona para login */}
          {!isAuthenticated && <Route path="*" element={<Navigate to="/login" replace />} />}

          {/* Se autenticado e nenhuma rota acima bateu (e não é /login ou /register), redireciona para / */}
          {isAuthenticated && <Route path="*" element={<Navigate to="/" replace />} />}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
