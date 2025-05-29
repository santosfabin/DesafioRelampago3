import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router';

const LandingPage = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to AssetManager
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" paragraph align="center">
          Manage your assets and their maintenance schedules efficiently.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button variant="contained" color="primary" component={RouterLink} to="/assets">
            View My Assets
          </Button>
          <Button variant="outlined" color="primary" component={RouterLink} to="/assets/new">
            Add New Asset
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LandingPage;
