// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'; // Certifique-se que é react-router-dom
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './components/Login';
import Register from './components/Register';
import Logout from './components/Logout';

// Content Pages
import LandingPage from './pages/LandingPage';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import MaintenanceList from './components/MaintenanceList';
import MaintenanceForm from './components/MaintenanceForm';
import UserProfile from './components/UserProfile'; // <<< ADICIONE O IMPORT

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
                setIsAuthenticated={setIsAuthenticated} // Passa para MainLayout (que passa para Header)
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

            {/* Rotas Protegidas - só renderizam se isAuthenticated for true */}
            {isAuthenticated && (
              <>
                <Route path="/" element={<LandingPage />} />
                <Route path="/assets" element={<AssetList />} />
                <Route path="/assets/new" element={<AssetForm />} />
                <Route path="/assets/:id" element={<AssetForm />} />
                <Route path="/assets/:assetId/maintenances" element={<MaintenanceList />} />
                <Route path="/assets/:assetId/maintenances/new" element={<MaintenanceForm />} />
                <Route
                  path="/assets/:assetId/maintenances/:maintenanceId"
                  element={<MaintenanceForm />}
                />
                <Route
                  path="/logout"
                  element={<Logout setIsAuthenticated={setIsAuthenticated} />}
                />

                {/* ================================================================= */}
                {/* CORREÇÃO AQUI: Passar setIsAuthenticated para UserProfile        */}
                {/* ================================================================= */}
                <Route
                  path="/profile"
                  element={<UserProfile setIsAuthenticated={setIsAuthenticated} />}
                />
              </>
            )}
          </Route>

          {/* Redirecionamentos catch-all (manter fora da rota com MainLayout se MainLayout não deve aparecer aqui) */}
          {!isAuthenticated && <Route path="*" element={<Navigate to="/login" replace />} />}

          {/* Se autenticado e nenhuma rota protegida acima bateu, redireciona para a home */}
          {/* Este precisa estar depois das rotas protegidas e da rota de MainLayout */}
          {isAuthenticated && (
            <Route
              path="*"
              element={
                <Routes>
                  {' '}
                  {/* Nested Routes para que este catch-all não sobrescreva o MainLayout */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              }
            />
          )}
          {/* Uma forma mais simples para o catch-all de autenticado, se todas as rotas autenticadas estão no MainLayout:
          {isAuthenticated && (
             <Route path="*" element={<Navigate to="/" replace />} /> // Colocar dentro do bloco isAuthenticated, após todas as rotas específicas
          )}
          Considerando a estrutura atual, o catch-all para !isAuthenticated está ok.
          Para isAuthenticated, se a rota não for encontrada DENTRO do <Route element={<MainLayout.../>}>,
          o React Router pode não ter uma rota para renderizar, resultando em página em branco,
          a menos que MainLayout tenha seu próprio catch-all interno.
          A forma mais simples de catch-all para usuário logado, se todas as rotas protegidas já estão listadas:
          Se a rota /profile está dentro do grupo isAuthenticated, então o catch-all final
          para usuários logados já pode ser apenas <Route path="*" element={<Navigate to="/" replace />} />
          colocado ao final do bloco {isAuthenticated && (<> ... </>) }
          Vamos simplificar o redirecionamento catch-all para usuários logados:
          */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
