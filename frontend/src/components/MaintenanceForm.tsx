import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select'; // Usando import de tipo
import { useParams, useNavigate } from 'react-router'; // Assumindo react-router
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
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
  description: string;
  performed_at: string;
  status: string;
  next_due_date: string | null;
  next_due_usage_limit: string | null;
  next_due_usage_current: string | null;
  usage_unit: string | null;
}

interface Maintenance {
  id: string;
  service: string;
  description?: string | null;
  performed_at?: string | null;
  status: string;
  next_due_date?: string | null;
  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: string | null;
  asset_id?: string;
  created_at?: string;
}

type PredictionType = 'date' | 'usage' | 'none';

const MaintenanceForm = () => {
  const { assetId, maintenanceId } = useParams<{ assetId: string; maintenanceId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(maintenanceId);

  const initialFormData: MaintenanceFormData = {
    service: '',
    description: '',
    performed_at: '',
    status: 'ativa',
    next_due_date: null,
    next_due_usage_limit: null,
    next_due_usage_current: null,
    usage_unit: null,
  };

  const [formData, setFormData] = useState<MaintenanceFormData>(initialFormData);
  const [predictionType, setPredictionType] = useState<PredictionType>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      setFormData({
        // Passa o objeto diretamente
        ...initialFormData,
        performed_at: new Date().toISOString().split('T')[0],
      });
      setPredictionType('none');
    } else if (assetId && maintenanceId) {
      setLoading(true);
      setError(null);
      const fetchMaintenance = async () => {
        try {
          const response = await fetch(`/api/assets/${assetId}/maintenances/${maintenanceId}`);
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) navigate('/login');
            let errorMsg = 'Failed to fetch maintenance details';
            try {
              const data = await response.json();
              if (data && data.error) errorMsg = data.error;
              else if (data && data.message) errorMsg = data.message;
            } catch (parseErr) {
              console.warn('Could not parse error response JSON (fetchMaintenance):', parseErr);
            }
            throw new Error(errorMsg);
          }
          const responseData = await response.json();

          let maintDetails: Maintenance | undefined;

          if (
            responseData &&
            responseData.maintenance &&
            typeof responseData.maintenance === 'object' &&
            !Array.isArray(responseData.maintenance)
          ) {
            maintDetails = responseData.maintenance as Maintenance;
            // Exemplo 2: se a API retornar { maintenance: [ { ...dados... } ] } (array com um item)
          } else if (
            responseData &&
            Array.isArray(responseData.maintenance) &&
            responseData.maintenance.length > 0
          ) {
            maintDetails = responseData.maintenance[0] as Maintenance;
            // Exemplo 3: se a API retornar o objeto da manutenção diretamente na raiz
          } else if (
            responseData &&
            typeof responseData === 'object' &&
            !Array.isArray(responseData) &&
            responseData.id
          ) {
            maintDetails = responseData as Maintenance;
          }
          // Adicione mais 'else if' se a API puder ter outras estruturas para uma única manutenção

          if (maintDetails) {
            setFormData({
              service: maintDetails.service || '',
              description: maintDetails.description || '',
              performed_at: maintDetails.performed_at
                ? new Date(maintDetails.performed_at).toISOString().split('T')[0]
                : '',
              status: maintDetails.status || 'ativa',
              next_due_date: maintDetails.next_due_date
                ? new Date(maintDetails.next_due_date).toISOString().split('T')[0]
                : null,
              next_due_usage_limit: maintDetails.next_due_usage_limit?.toString() || null,
              next_due_usage_current: maintDetails.next_due_usage_current?.toString() || null,
              usage_unit: maintDetails.usage_unit || null,
            });
            if (maintDetails.next_due_date) {
              setPredictionType('date');
            } else if (
              maintDetails.next_due_usage_limit !== null ||
              maintDetails.next_due_usage_current !== null ||
              maintDetails.usage_unit
            ) {
              setPredictionType('usage');
            } else {
              setPredictionType('none');
            }
          } else {
            console.error(
              'MaintenanceForm: Maintenance details not found or in unexpected format.',
              responseData
            );
            setError('Failed to load maintenance details correctly.');
            setFormData(initialFormData);
            setPredictionType('none');
          }
        } catch (err: unknown) {
          if (err instanceof Error) setError(err.message);
          else if (typeof err === 'string') setError(err);
          else setError('An error occurred while fetching maintenance details.');
          setFormData(initialFormData);
          setPredictionType('none');
        } finally {
          setLoading(false);
        }
      };
      fetchMaintenance();
    }
  }, [assetId, maintenanceId, isEditMode, navigate]);

  const handlePredictionTypeChange = (event: SelectChangeEvent<PredictionType>) => {
    const newType = event.target.value as PredictionType;
    setPredictionType(newType);
    setFormData(prev => {
      /* ... como antes ... */
      const newState = { ...prev };
      if (newType === 'date') {
        newState.next_due_usage_limit = null;
        newState.next_due_usage_current = null;
        newState.usage_unit = null;
      } else if (newType === 'usage') {
        newState.next_due_date = null;
      } else {
        newState.next_due_date = null;
        newState.next_due_usage_limit = null;
        newState.next_due_usage_current = null;
        newState.usage_unit = null;
      }
      return newState;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    let processedValue: string | null = value;
    if (name !== 'description' && name !== 'service' && name !== 'status' && value === '') {
      processedValue = null;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);

    // PONTO DE DEBUG 1: Verificar estados antes de construir o payload
    console.log('handleSubmit - predictionType:', predictionType);
    console.log('handleSubmit - formData:', JSON.parse(JSON.stringify(formData))); // Clonar para log limpo

    if (!formData.service.trim()) {
      console.log('Validação bloqueada: Service field is required.');
      setError('Service field is required.');
      setSubmitLoading(false);
      return;
    }

    // Ajustar payload para garantir que strings vazias para data/uso se tornem null
    const payload: MaintenancePayload = {
      service: formData.service,
      description: formData.description || null,
      performed_at: formData.performed_at || null, // Já estava ok
      status: formData.status,
      // Se predictionType for 'date', usa formData.next_due_date (ou null se for string vazia/null). Senão, null.
      next_due_date: predictionType === 'date' ? formData.next_due_date || null : null,
      // Se predictionType for 'usage', converte para número (ou null). Senão, null.
      next_due_usage_limit:
        predictionType === 'usage' && formData.next_due_usage_limit
          ? parseInt(formData.next_due_usage_limit, 10)
          : null,
      next_due_usage_current:
        predictionType === 'usage' && formData.next_due_usage_current
          ? parseInt(formData.next_due_usage_current, 10)
          : null,
      usage_unit: predictionType === 'usage' ? formData.usage_unit || null : null,
    };

    // PONTO DE DEBUG 2: Verificar o payload final
    console.log('handleSubmit - payload a ser enviado:', payload);

    // Validações
    if (payload.status === 'ativa') {
      if (predictionType === 'none') {
        console.log('Validação bloqueada: predictionType é none para status ativa.');
        setError(
          'Active maintenances require a prediction. Please select "By Date" or "By Usage".'
        );
        setSubmitLoading(false);
        return;
      }
      if (predictionType === 'date' && !payload.next_due_date) {
        // !payload.next_due_date já cobre null
        console.log(
          'Validação bloqueada: next_due_date ausente para predictionType date e status ativa.'
        );
        setError('For "By Date" prediction, "Next Due Date" is required for active maintenances.');
        setSubmitLoading(false);
        return;
      }
      if (
        predictionType === 'usage' &&
        !(
          payload.next_due_usage_limit !== null &&
          payload.next_due_usage_current !== null &&
          payload.usage_unit
        )
      ) {
        console.log(
          'Validação bloqueada: campos de uso incompletos para predictionType usage e status ativa.'
        );
        setError(
          'For "By Usage" prediction, all three fields (limit, current, and unit) are required for active maintenances.'
        );
        setSubmitLoading(false);
        return;
      }
    }
    if (predictionType === 'usage') {
      const usageFieldsProvided = [
        payload.next_due_usage_limit,
        payload.next_due_usage_current,
        payload.usage_unit,
      ];
      const filledUsageFields = usageFieldsProvided.filter(field => field !== null).length; // Checa apenas por null

      if (filledUsageFields > 0 && filledUsageFields < 3) {
        console.log('Validação bloqueada: campos de uso parcialmente preenchidos.');
        setError(
          'If providing "Next Due Usage", all three fields (limit, current, and unit) are required.'
        );
        setSubmitLoading(false);
        return;
      }
    }
    try {
      const url = isEditMode
        ? `/api/assets/${assetId}/maintenances/${maintenanceId}`
        : `/api/assets/${assetId}/maintenances`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = `Failed to ${isEditMode ? 'update' : 'create'} maintenance`;
        if (errorData && errorData.error && typeof errorData.error === 'string') {
          errorMsg = errorData.error;
        } else if (
          errorData &&
          errorData.error &&
          errorData.error.error &&
          typeof errorData.error.error === 'string'
        ) {
          errorMsg = errorData.error.error;
        } else if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
        throw new Error(errorMsg);
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

  if (loading && isEditMode) {
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
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
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
                autoFocus={!isEditMode}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Description (Optional)"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                disabled={submitLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                margin="normal"
                fullWidth
                id="performed_at"
                label="Performed At"
                name="performed_at"
                type="date"
                value={formData.performed_at}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={submitLoading}
                required={!isEditMode}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.5 }}>
                Next Due Prediction
              </Typography>
              <FormControl fullWidth margin="dense" disabled={submitLoading}>
                <InputLabel id="prediction-type-label">Prediction Type</InputLabel>
                <Select
                  labelId="prediction-type-label"
                  value={predictionType}
                  label="Prediction Type"
                  onChange={handlePredictionTypeChange}
                >
                  <MenuItem value="none">No Prediction</MenuItem>
                  <MenuItem value="date">By Date</MenuItem>
                  <MenuItem value="usage">By Usage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {predictionType === 'date' && (
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
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
                  disabled={submitLoading}
                  required
                />
              </Grid>
            )}
            {predictionType === 'usage' && (
              <>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ mt: 1 }}>
                  <TextField
                    margin="dense"
                    fullWidth
                    id="next_due_usage_limit"
                    label="Next Due Usage Limit"
                    name="next_due_usage_limit"
                    type="number"
                    value={formData.next_due_usage_limit || ''}
                    onChange={handleChange}
                    disabled={submitLoading}
                    required
                    InputProps={{ onWheel: event => (event.target as HTMLElement).blur() }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ mt: 1 }}>
                  <TextField
                    margin="dense"
                    fullWidth
                    id="next_due_usage_current"
                    label="Current Usage"
                    name="next_due_usage_current"
                    type="number"
                    value={formData.next_due_usage_current || ''}
                    onChange={handleChange}
                    disabled={submitLoading}
                    required
                    InputProps={{ onWheel: event => (event.target as HTMLElement).blur() }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ mt: 1 }}>
                  <FormControl fullWidth margin="dense" disabled={submitLoading} required>
                    <InputLabel id="usage_unit-label">Usage Unit</InputLabel>
                    <Select
                      labelId="usage_unit-label"
                      id="usage_unit"
                      name="usage_unit"
                      value={formData.usage_unit || ''}
                      label="Usage Unit"
                      onChange={handleChange}
                    >
                      {usageUnits.map(u => (
                        <MenuItem key={u} value={u}>
                          {u.charAt(0).toUpperCase() + u.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/assets/${assetId}/maintenances`)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} color="inherit" />
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
