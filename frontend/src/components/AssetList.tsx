// frontend/src/components/AssetList.tsx

import { useEffect, useState, useCallback } from 'react'; // Adicionei useCallback por consistência, embora não seja estritamente necessário aqui como em MaintenanceList
import { Link as RouterLink, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface Asset {
  id: string;
  name: string;
  description: string;
  importance: number;
}

const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Envolver em useCallback se for adicionado como dependência de useEffect
  // Por enquanto, fetchAssets é chamado apenas uma vez no mount, então useCallback é opcional
  // mas se a lógica de re-fetch for adicionada, seria bom.
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch assets';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) errorMsg = errorData.message;
        } catch (_parseError) {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setAssets(data.body || data);
    } catch (err: unknown) {
      // <--- CORRIGIDO
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unexpected error occurred while fetching assets.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]); // navigate é uma dependência estável

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]); // Agora fetchAssets é uma dependência

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      // setLoading(true); // Ou uma flag de loading específica para delete
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/assets/${assetId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          let errorMsg = 'Failed to delete asset';
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (_parseError) {
            /* Ignore */
          }
          throw new Error(errorMsg);
        }
        setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
      } catch (err: unknown) {
        // <--- CORRIGIDO
        let messageToShow = 'An error occurred during deletion.';
        if (err instanceof Error) {
          messageToShow = err.message;
        } else if (typeof err === 'string') {
          messageToShow = err;
        }
        setError(messageToShow);
        setTimeout(() => setError(null), 3000);
      } finally {
        // setLoading(false);
      }
    }
  };

  if (loading && assets.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 3 }}>
        <Typography variant="h4" component="h1">
          My Assets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/assets/new"
          startIcon={<AddIcon />}
        >
          Add New Asset
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {assets.length === 0 && !loading && !error && (
        <Typography variant="subtitle1" sx={{ mt: 3, textAlign: 'center' }}>
          No assets found. Start by adding a new asset.
        </Typography>
      )}

      {assets.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Importance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map(asset => (
                <TableRow key={asset.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {asset.name}
                  </TableCell>
                  <TableCell>{asset.description}</TableCell>
                  <TableCell align="right">{asset.importance}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="maintenances"
                      color="default"
                      onClick={() => navigate(`/assets/${asset.id}/maintenances`)}
                      title="View Maintenances"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      aria-label="edit"
                      color="primary"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      title="Edit Asset"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => handleDelete(asset.id)}
                      title="Delete Asset"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AssetList;
