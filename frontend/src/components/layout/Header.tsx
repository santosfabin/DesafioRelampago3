import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link as RouterLink, useNavigate } from 'react-router';
import Box from '@mui/material/Box';

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token'); // Simple check

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Note: The setIsAuthenticated state in App.tsx will need to be updated.
    // This simple logout here just clears the token and navigates.
    // For a full solution, you'd lift state up or use context.
    // For now, we just redirect. The App.tsx useEffect will handle the rest on reload/navigation.
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          AssetManager
        </Typography>
        {isAuthenticated ? (
          <Box>
            <Button color="inherit" component={RouterLink} to="/assets">
              Assets
            </Button>
            {/* Add other navigation buttons here as needed */}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
