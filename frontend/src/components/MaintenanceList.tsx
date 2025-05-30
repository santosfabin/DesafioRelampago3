// frontend/src/components/MaintenanceList.tsx
import { useEffect, useState, useCallback, useMemo } from 'react'; // Adicionado useMemo
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
import TableSortLabel from '@mui/material/TableSortLabel'; // IMPORTADO PARA ORDENAÇÃO
import { visuallyHidden } from '@mui/utils'; // IMPORTADO PARA ACESSIBILIDADE DA ORDENAÇÃO

interface Maintenance {
  id: string;
  service: string;
  description?: string;
  performed_at?: string | null; // Permitir null se a API puder retornar
  status: string;
  next_due_date?: string | null; // Permitir null
  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: string | null;
  // Campos para a coluna "Next Due" combinada
  _nextDueDisplay?: string; // Campo calculado para exibição e ordenação simples
}

interface AssetInfo {
  id: string;
  name: string;
}

// Tipos para ordenação
type SortDirection = 'asc' | 'desc';
// Chaves de Maintenance que queremos permitir ordenação.
// _nextDueDisplay é um campo derivado para facilitar a ordenação da coluna "Next Due".
type MaintenanceSortKeys = 'service' | 'performed_at' | 'status' | '_nextDueDisplay';

interface SortConfig {
  key: MaintenanceSortKeys | null;
  direction: SortDirection;
}

// Função para formatar a data ou a string de uso para a coluna "Next Due"
const formatNextDue = (maint: Maintenance): string => {
  if (maint.next_due_date) {
    return new Date(maint.next_due_date).toLocaleDateString();
  }
  if (maint.next_due_usage_limit !== null && maint.next_due_usage_limit !== undefined) {
    return `${maint.next_due_usage_current || 0}/${maint.next_due_usage_limit} ${
      maint.usage_unit || ''
    }`;
  }
  return 'N/A';
};

const MaintenanceList = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [originalMaintenances, setOriginalMaintenances] = useState<Maintenance[]>([]);
  const [maintenancesToDisplay, setMaintenancesToDisplay] = useState<Maintenance[]>([]);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'performed_at',
    direction: 'desc',
  }); // Default sort

  const fetchMaintenancesAndAsset = useCallback(async () => {
    if (!assetId) {
      setError('Asset ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch Asset Info (código existente)
      const assetResponse = await fetch(`/api/assets/${assetId}`);
      if (!assetResponse.ok) {
        /* ... tratamento de erro ... */
        if (assetResponse.status === 401 || assetResponse.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch asset details';
        try {
          const d = await assetResponse.json();
          if (d && d.error) errorMsg = d.error;
          else if (d && d.message) errorMsg = d.message;
        } catch (e) {
          console.warn('No JSON in asset error', e);
        }
        throw new Error(errorMsg);
      }
      const assetRData = await assetResponse.json();
      let fAssetInfo: AssetInfo | null = null;
      if (assetRData && Array.isArray(assetRData.asset) && assetRData.asset.length > 0) {
        const aData = assetRData.asset[0];
        fAssetInfo = { id: aData.id, name: aData.name };
      } else if (
        assetRData &&
        typeof assetRData === 'object' &&
        !Array.isArray(assetRData) &&
        assetRData.id
      ) {
        fAssetInfo = { id: assetRData.id, name: assetRData.name };
      }
      if (fAssetInfo) {
        setAssetInfo(fAssetInfo);
      } else {
        setError(p => (p ? `${p}\nAsset details not found.` : 'Asset details not found.'));
      }

      // Fetch Maintenances
      const maintResponse = await fetch(`/api/assets/${assetId}/maintenances`);
      if (!maintResponse.ok) {
        /* ... tratamento de erro ... */
        if (maintResponse.status === 401 || maintResponse.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch maintenances';
        try {
          const d = await maintResponse.json();
          if (d && d.error) errorMsg = d.error;
          else if (d && d.message) errorMsg = d.message;
        } catch (e) {
          console.warn('No JSON in maint error', e);
        }
        throw new Error(errorMsg);
      }
      const maintRData = await maintResponse.json();
      let fetchedMaint: Maintenance[] = [];
      if (maintRData && Array.isArray(maintRData.maintenance)) {
        fetchedMaint = maintRData.maintenance;
      } else if (Array.isArray(maintRData)) {
        fetchedMaint = maintRData;
      } // ... outros fallbacks ...

      if (!Array.isArray(fetchedMaint)) {
        setError(p =>
          p
            ? `${p}\nUnexpected data format for maintenances.`
            : 'Unexpected data format for maintenances.'
        );
        fetchedMaint = [];
      }
      // Adicionar o campo _nextDueDisplay calculado
      const processedMaintenances = fetchedMaint.map(m => ({
        ...m,
        _nextDueDisplay: formatNextDue(m),
      }));
      setOriginalMaintenances(processedMaintenances);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('An unexpected error occurred while fetching data.');
      setAssetInfo(null);
      setOriginalMaintenances([]);
    } finally {
      setLoading(false);
    }
  }, [assetId, navigate]);

  useEffect(() => {
    fetchMaintenancesAndAsset();
  }, [fetchMaintenancesAndAsset]);

  const handleRequestSort = (property: MaintenanceSortKeys) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc';
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedMaintenancesToDisplay = useMemo(() => {
    if (!sortConfig.key) {
      return originalMaintenances;
    }
    const sortableItems = [...originalMaintenances];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key!];
      const valB = b[sortConfig.key!];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      // Tratamento especial para datas (performed_at e next_due_date, que é parte de _nextDueDisplay)
      if (sortConfig.key === 'performed_at') {
        // As datas podem ser null, já tratamos acima. Se não forem, são strings ISO.
        comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        // Para _nextDueDisplay, a ordenação alfabética da string formatada pode ser suficiente inicialmente
        // Ou podemos adicionar lógica mais complexa para diferenciar 'N/A' de datas e strings de uso
        if (valA === 'N/A') return 1; // Coloca 'N/A' no final
        if (valB === 'N/A') return -1;
        comparison = valA.localeCompare(valB);
      } else {
        if (valA < valB) comparison = -1;
        if (valA > valB) comparison = 1;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sortableItems;
  }, [originalMaintenances, sortConfig]);

  useEffect(() => {
    setMaintenancesToDisplay(sortedMaintenancesToDisplay);
  }, [sortedMaintenancesToDisplay]);

  const handleDelete = async (maintenanceId: string) => {
    if (!assetId) {
      setError('Cannot delete: Asset ID missing.');
      return;
    }
    if (window.confirm('Delete this maintenance record?')) {
      try {
        const response = await fetch(`/api/assets/${assetId}/maintenances/${maintenanceId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          let errorMsg = 'Failed to delete maintenance';
          try {
            const d = await response.json();
            if (d && d.error) errorMsg = d.error;
            else if (d && d.message) errorMsg = d.message;
          } catch (e) {
            console.warn('No JSON in delete error', e);
          }
          throw new Error(errorMsg);
        }
        setOriginalMaintenances(prev => prev.filter(m => m.id !== maintenanceId));
      } catch (err: unknown) {
        let msg = 'Error during deletion.';
        if (err instanceof Error) msg = err.message;
        else if (typeof err === 'string') msg = err;
        setError(msg);
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  if (loading && !assetInfo && originalMaintenances.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const headCells: { id: MaintenanceSortKeys; label: string; numeric: boolean }[] = [
    { id: 'service', numeric: false, label: 'Service' },
    { id: 'performed_at', numeric: false, label: 'Performed At' },
    { id: 'status', numeric: false, label: 'Status' },
    { id: '_nextDueDisplay', numeric: false, label: 'Next Due' }, // Ordena pela string de display
  ];

  return (
    <Container maxWidth="lg">
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/assets')} sx={{ my: 2 }}>
        Back to Assets
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Maintenances for {assetInfo ? `"${assetInfo.name}"` : assetId ? 'Asset' : '...'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to={`/assets/${assetId}/maintenances/new`}
          startIcon={<AddIcon />}
          disabled={!assetId || loading}
        >
          Add New Maintenance
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && (assetInfo || originalMaintenances.length > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, alignItems: 'center' }}>
          <CircularProgress size={24} />{' '}
          <Typography sx={{ ml: 1 }} variant="body2">
            Updating...
          </Typography>
        </Box>
      )}
      {!loading && maintenancesToDisplay.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ mt: 3, textAlign: 'center' }}>
          No maintenance records found.
        </Typography>
      )}
      {maintenancesToDisplay.length > 0 && (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="maintenances table">
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
              {maintenancesToDisplay.map(maint => (
                <TableRow
                  hover
                  key={maint.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {maint.service}
                  </TableCell>
                  <TableCell>
                    {maint.performed_at ? new Date(maint.performed_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{maint.status}</TableCell>
                  <TableCell>{maint._nextDueDisplay}</TableCell> {/* Usa o campo formatado */}
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
