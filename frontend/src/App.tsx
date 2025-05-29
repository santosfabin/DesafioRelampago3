import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './components/Login';
import Register from './components/Register';
import Logout from './components/Logout'; // Assuming Logout component handles navigation

// Content Pages
import LandingPage from './pages/LandingPage'; // New Landing Page
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
// Removed Dashboard import as LandingPage will serve as the initial authenticated page

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []); // Re-run on mount

  // This effect will re-check authentication status whenever the token changes in localStorage
  // This is a simple way to react to login/logout from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange); // Listen for changes in other tabs

    // Custom event for same-tab updates (e.g., after login/logout)
    const handleTokenChange = () => {
      handleStorageChange();
    };
    window.addEventListener('tokenChanged', handleTokenChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenChanged', handleTokenChange);
    };
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes accessible always, but MainLayout header will adapt */}
          <Route element={<MainLayout />}>
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Logout route - can be outside or inside MainLayout depending on desired UI */}
          {/* If Logout component renders UI, it should be within MainLayout */}
          {/* If it's just logic, its placement is less critical for UI */}
          <Route
            path="/logout"
            element={
              <MainLayout>
                <Logout setIsAuthenticated={setIsAuthenticated} />
              </MainLayout>
            }
          />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route element={<MainLayout />}>
              {' '}
              {/* Apply layout to all authenticated routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/assets" element={<AssetList />} />
              <Route path="/assets/new" element={<AssetForm />} />
              <Route path="/assets/:id" element={<AssetForm />} />
              <Route path="/assets/:assetId/maintenances" element={<MaintenanceList />} />
              <Route path="/assets/:assetId/maintenances/new" element={<MaintenanceForm />} />
              {/* Add other protected routes here */}
              <Route path="*" element={<Navigate to="/" replace />} />{' '}
              {/* Redirect unknown authenticated routes to landing */}
            </Route>
          ) : (
            // Redirect to login if not authenticated and trying to access any other path
            // The Login and Register routes are handled above and will show the MainLayout (Header/Footer)
            // This catch-all ensures any other path attempt goes to login
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
