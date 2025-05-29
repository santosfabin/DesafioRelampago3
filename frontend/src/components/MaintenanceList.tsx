import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useParams, Link as RouterLink, useNavigate } from 'react-router';
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
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface Maintenance {
  id: string;
  service: string;
  description?: string;
  performed_at?: string; // Date as string
  status: string;
  next_due_date?: string; // Date as string
  next_due_usage_limit?: number;
  next_due_usage_current?: number;
  usage_unit?: string;
}

interface AssetInfo {
  id: string;
  name: string;
}

const MaintenanceList = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenancesAndAsset = useCallback(async () => {
    // Wrapped in useCallback
    if (!assetId) {
      setError('Asset ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Fetch Asset Info
      const assetResponse = await fetch(`/api/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assetResponse.ok) {
        if (assetResponse.status === 401 || assetResponse.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch asset details';
        try {
          const errorData = await assetResponse.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (_parseError) {
          // Prefixed with underscore
          // Ignore if parsing fails, use default message
        }
        throw new Error(errorMsg);
      }
      const assetData = await assetResponse.json();
      setAssetInfo(assetData.body || assetData);

      // Fetch Maintenances
      const maintResponse = await fetch(`/api/assets/${assetId}/maintenances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!maintResponse.ok) {
        if (maintResponse.status === 401 || maintResponse.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch maintenances';
        try {
          const errorData = await maintResponse.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (_parseError) {
          // Prefixed with underscore
          // Ignore if parsing fails, use default message
        }
        throw new Error(errorMsg);
      }
      const maintData = await maintResponse.json();
      setMaintenances(maintData.body || maintData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unexpected error occurred while fetching data.');
      }
    } finally {
      setLoading(false);
    }
  }, [assetId, navigate]); // Dependencies for useCallback

  useEffect(() => {
    fetchMaintenancesAndAsset();
  }, [fetchMaintenancesAndAsset]); // useEffect now depends on the memoized function

  const handleDelete = async (maintenanceId: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/assets/${assetId}/maintenances/${maintenanceId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          let errorMsg = 'Failed to delete maintenance';
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
              errorMsg = errorData.message;
            }
          } catch (_parseError) {
            // Prefixed with underscore
            // Ignore if parsing fails
          }
          throw new Error(errorMsg);
        }
        setMaintenances(prev => prev.filter(m => m.id !== maintenanceId));
      } catch (err: unknown) {
        let messageToShow = 'An error occurred during deletion.';
        if (err instanceof Error) {
          messageToShow = err.message;
        } else if (typeof err === 'string') {
          messageToShow = err;
        }
        setError(messageToShow);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  // ... (rest of the component remains the same)
  if (loading && !assetInfo && maintenances.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/assets')} sx={{ my: 2 }}>
        Back to Assets
      </Button>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Maintenances for {assetInfo ? `"${assetInfo.name}"` : 'Asset'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to={`/assets/${assetId}/maintenances/new`}
          startIcon={<AddIcon />}
          disabled={!assetId}
        >
          Add New Maintenance
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {maintenances.length === 0 && !loading && !error && (
        <Typography variant="subtitle1" sx={{ mt: 3, textAlign: 'center' }}>
          No maintenance records found for this asset.
        </Typography>
      )}

      {maintenances.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="maintenances table">
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Performed At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Next Due</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenances.map(maint => (
                <TableRow key={maint.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {maint.service}
                  </TableCell>
                  <TableCell>
                    {maint.performed_at ? new Date(maint.performed_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{maint.status}</TableCell>
                  <TableCell>
                    {maint.next_due_date
                      ? new Date(maint.next_due_date).toLocaleDateString()
                      : maint.next_due_usage_limit
                      ? `${maint.next_due_usage_current || 0}/${maint.next_due_usage_limit} ${
                          maint.usage_unit || ''
                        }`
                      : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="edit"
                      color="primary"
                      onClick={() => navigate(`/assets/${assetId}/maintenances/${maint.id}`)}
                      title="Edit Maintenance"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => handleDelete(maint.id)}
                      title="Delete Maintenance"
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

export default MaintenanceList;
