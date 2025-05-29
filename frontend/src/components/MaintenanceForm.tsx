import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface MaintenancePayload {
  service: string;
  description?: string | null;
  performed_at?: string | null;
  status: string;
  next_due_date?: string | null;
  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: string | null;
}

interface MaintenanceFormData {
  service: string;
  description?: string;
  performed_at?: string;
  status: string;
  next_due_date?: string | null;
  next_due_usage_limit?: string | null;
  next_due_usage_current?: string | null;
  usage_unit?: string | null;
}

const MaintenanceForm = () => {
  const { assetId, maintenanceId } = useParams<{ assetId: string; maintenanceId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(maintenanceId);

  const initialFormData: MaintenanceFormData = {
    service: '',
    description: '',
    performed_at: new Date().toISOString().split('T')[0],
    status: 'ativa',
    next_due_date: null,
    next_due_usage_limit: null,
    next_due_usage_current: null,
    usage_unit: null,
  };

  const [formData, setFormData] = useState<MaintenanceFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && assetId && maintenanceId) {
      setLoading(true);
      setError(null);
      const fetchMaintenance = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/assets/${assetId}/maintenances/${maintenanceId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) navigate('/login');
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch maintenance details');
          }
          const data = await response.json();
          const maintData = data.body || data;
          setFormData({
            service: maintData.service || '',
            description: maintData.description || '',
            performed_at: maintData.performed_at
              ? new Date(maintData.performed_at).toISOString().split('T')[0]
              : undefined,
            status: maintData.status || 'ativa',
            next_due_date: maintData.next_due_date
              ? new Date(maintData.next_due_date).toISOString().split('T')[0]
              : null,
            next_due_usage_limit: maintData.next_due_usage_limit?.toString() || null,
            next_due_usage_current: maintData.next_due_usage_current?.toString() || null,
            usage_unit: maintData.usage_unit || null,
          });
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else if (typeof err === 'string') {
            setError(err);
          } else {
            setError('An error occurred while fetching maintenance details.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchMaintenance();
    }
  }, [assetId, maintenanceId, isEditMode, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let newState = { ...prev, [name]: value === '' ? null : value };
      if (name === 'next_due_date' && value) {
        newState = {
          ...newState,
          next_due_usage_limit: null,
          next_due_usage_current: null,
          usage_unit: null,
        };
      } else if (
        ['next_due_usage_limit', 'next_due_usage_current', 'usage_unit'].includes(name) &&
        value
      ) {
        newState = { ...newState, next_due_date: null };
      }
      return newState;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);
    const payload: MaintenancePayload = {
      service: formData.service,
      description: formData.description || null,
      performed_at: formData.performed_at || null,
      status: formData.status,
      next_due_date: formData.next_due_date || null,
      next_due_usage_limit: formData.next_due_usage_limit
        ? parseInt(formData.next_due_usage_limit, 10)
        : null,
      next_due_usage_current: formData.next_due_usage_current
        ? parseInt(formData.next_due_usage_current, 10)
        : null,
      usage_unit: formData.usage_unit || null,
    };
    try {
      const token = localStorage.getItem('token');
      const url = isEditMode
        ? `/api/assets/${assetId}/maintenances/${maintenanceId}`
        : `/api/assets/${assetId}/maintenances`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} maintenance`
        );
      }
      navigate(`/assets/${assetId}/maintenances`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError(`An error occurred while ${isEditMode ? 'updating' : 'creating'} maintenance.`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const usageUnits = ['km', 'horas', 'ciclos'];
  const statuses = ['ativa', 'realizada', 'adiada', 'cancelada'];

  return (
    <Container maxWidth="md">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/assets/${assetId}/maintenances`)}
        sx={{ my: 2 }}
      >
        Back to Maintenances
      </Button>
      <Paper sx={{ p: 3, mt: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Maintenance' : 'Add New Maintenance'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="service"
                label="Service Performed / To Be Performed"
                name="service"
                value={formData.service}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Description (Optional)"
                name="description"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="normal"
                fullWidth
                id="performed_at"
                label="Performed At (Optional)"
                name="performed_at"
                type="date"
                value={formData.performed_at || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={submitLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {' '}
              {/* Changed to size prop */}
              <FormControl fullWidth margin="normal" required disabled={submitLoading}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  {statuses.map(s => (
                    <MenuItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              {' '}
              {/* Changed to size prop */}
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Next Due Prediction (Optional - Choose Date OR Usage)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="dense"
                fullWidth
                id="next_due_date"
                label="Next Due Date"
                name="next_due_date"
                type="date"
                value={formData.next_due_date || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={
                  submitLoading ||
                  !!(
                    formData.next_due_usage_limit ||
                    formData.next_due_usage_current ||
                    formData.usage_unit
                  )
                }
                helperText={
                  formData.next_due_usage_limit ||
                  formData.next_due_usage_current ||
                  formData.usage_unit
                    ? 'Clear usage fields to set date'
                    : ''
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} /> {/* Spacer, using size prop */}
            <Grid size={{ xs: 12, sm: 4 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="dense"
                fullWidth
                id="next_due_usage_limit"
                label="Next Due Usage Limit"
                name="next_due_usage_limit"
                type="number"
                value={formData.next_due_usage_limit || ''}
                onChange={handleChange}
                disabled={submitLoading || !!formData.next_due_date}
                helperText={formData.next_due_date ? 'Clear date to set usage' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {' '}
              {/* Changed to size prop */}
              <TextField
                margin="dense"
                fullWidth
                id="next_due_usage_current"
                label="Current Usage"
                name="next_due_usage_current"
                type="number"
                value={formData.next_due_usage_current || ''}
                onChange={handleChange}
                disabled={submitLoading || !!formData.next_due_date}
                helperText={formData.next_due_date ? 'Clear date to set usage' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              {' '}
              {/* Changed to size prop */}
              <FormControl
                fullWidth
                margin="dense"
                disabled={submitLoading || !!formData.next_due_date}
              >
                <InputLabel id="usage_unit-label">Usage Unit</InputLabel>
                <Select
                  labelId="usage_unit-label"
                  id="usage_unit"
                  name="usage_unit"
                  value={formData.usage_unit || ''}
                  label="Usage Unit"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {usageUnits.map(u => (
                    <MenuItem key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {formData.next_due_date && (
                  <Typography variant="caption" color="textSecondary">
                    Clear date to set usage
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/assets/${assetId}/maintenances`)}
              sx={{ mr: 2 }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} />
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Maintenance'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MaintenanceForm;
