import { useEffect, useState, useCallback, useMemo } from 'react';
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
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from '@mui/utils';
import Tooltip from '@mui/material/Tooltip';

interface Asset {
  id: string;
  name: string;
  description: string;
  importance: number;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof Asset | null;
  direction: SortDirection;
}

const AssetList = () => {
  const [originalAssets, setOriginalAssets] = useState<Asset[]>([]);
  const [assetsToDisplay, setAssetsToDisplay] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch assets';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) errorMsg = errorData.error;
          else if (errorData && errorData.message) errorMsg = errorData.message;
        } catch (parseError) {
          console.warn('Could not parse error response JSON (fetchAssets):', parseError);
        }
        throw new Error(errorMsg);
      }
      const responseData = await response.json();
      let fetchedAssets: Asset[] = [];
      if (responseData && Array.isArray(responseData.asset)) {
        fetchedAssets = responseData.asset;
      } else if (Array.isArray(responseData)) {
        fetchedAssets = responseData;
      }
      if (!Array.isArray(fetchedAssets)) {
        console.error('AssetList: Erro - fetchedAssets não é um array!', fetchedAssets);
        setError('Formato de dados inesperado recebido da API.');
        fetchedAssets = [];
      }
      setOriginalAssets(fetchedAssets);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('An unexpected error occurred while fetching assets.');
      setOriginalAssets([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleRequestSort = (property: keyof Asset) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc';
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedAssetsToDisplay = useMemo(() => {
    if (!sortConfig.key) return originalAssets;
    const sortableItems = [...originalAssets];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key!];
      const valB = b[sortConfig.key!];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        if (valA < valB) comparison = -1;
        if (valA > valB) comparison = 1;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sortableItems;
  }, [originalAssets, sortConfig]);

  useEffect(() => {
    setAssetsToDisplay(sortedAssetsToDisplay);
  }, [sortedAssetsToDisplay]);

  const handleDelete = async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        const response = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
        if (!response.ok) {
          let errorMsg = 'Failed to delete asset';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) errorMsg = errorData.error;
            else if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (parseError) {
            console.warn('Could not parse error response JSON (handleDelete):', parseError);
          }
          throw new Error(errorMsg);
        }
        setOriginalAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
      } catch (err: unknown) {
        let messageToShow = 'An error occurred during deletion.';
        if (err instanceof Error) messageToShow = err.message;
        else if (typeof err === 'string') messageToShow = err;
        setError(messageToShow);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  if (loading && originalAssets.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const headCells: { id: keyof Asset; label: string; numeric: boolean }[] = [
    { id: 'name', numeric: false, label: 'Name' },
    { id: 'description', numeric: false, label: 'Description' },
    { id: 'importance', numeric: true, label: 'Importance' },
  ];

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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && originalAssets.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, alignItems: 'center' }}>
          <CircularProgress size={24} />{' '}
          <Typography sx={{ ml: 1 }} variant="body2">
            Updating...
          </Typography>
        </Box>
      )}
      {!loading && assetsToDisplay.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ mt: 3, textAlign: 'center' }}>
          No assets found. Start by adding a new asset.
        </Typography>
      )}
      {assetsToDisplay.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="assets table">
            {' '}
            {/* Mudado aria-label */}
            <TableHead>
              <TableRow>
                {headCells.map(headCell => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={sortConfig.key === headCell.id ? sortConfig.direction : false}
                  >
                    <TableSortLabel
                      active={sortConfig.key === headCell.id}
                      direction={sortConfig.key === headCell.id ? sortConfig.direction : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                      {sortConfig.key === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {sortConfig.direction === 'desc'
                            ? 'sorted descending'
                            : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assetsToDisplay.map(asset => {
                if (!asset || typeof asset.id === 'undefined') return null;
                return (
                  <TableRow
                    hover
                    key={asset.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {asset.name}
                    </TableCell>
                    <TableCell>{asset.description}</TableCell>
                    <TableCell align="right">{asset.importance}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Maintenances">
                        <IconButton
                          aria-label="maintenances"
                          color="default"
                          onClick={() => navigate(`/assets/${asset.id}/maintenances`)}
                        >
                          <BuildIcon /> {/* ÍCONE ALTERADO */}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Asset">
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => navigate(`/assets/${asset.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Asset">
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default AssetList;
