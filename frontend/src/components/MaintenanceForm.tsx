import { useState, useEffect, type FormEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useParams, useNavigate } from 'react-router';
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

const USAGE_UNITS = ['km', 'horas', 'ciclos'];
const STATUSES = ['ativa', 'realizada', 'adiada', 'cancelada'];

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
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && assetId && maintenanceId) {
      setFetchLoading(true);
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
            !Array.isArray(responseData.maintenance) &&
            responseData.maintenance.id
          ) {
            maintDetails = responseData.maintenance as Maintenance;
          } else if (
            responseData &&
            Array.isArray(responseData.maintenance) &&
            responseData.maintenance.length > 0
          ) {
            maintDetails = responseData.maintenance[0] as Maintenance;
          } else if (
            responseData &&
            typeof responseData === 'object' &&
            !Array.isArray(responseData) &&
            responseData.id
          ) {
            maintDetails = responseData as Maintenance;
          } else {
            console.warn(
              'MaintenanceForm (fetchMaintenance) - Estrutura inesperada da API. MaintDetails não extraído:',
              responseData
            );
            maintDetails = undefined;
          }

          if (maintDetails) {
            let loadedUsageUnit: string | null = null;
            if (maintDetails.usage_unit && USAGE_UNITS.includes(maintDetails.usage_unit)) {
              loadedUsageUnit = maintDetails.usage_unit;
            }

            const formatToInputDate = (dateString: string | null | undefined): string => {
              if (!dateString) return '';
              try {
                if (dateString.includes('T')) {
                  return dateString.split('T')[0];
                }

                const d = new Date(dateString);
                if (!isNaN(d.getTime())) {
                  const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                  if (parts) return dateString;

                  return d.toISOString().split('T')[0];
                }
                return '';
              } catch (e) {
                console.error('Erro ao formatar data:', dateString, e);
                return '';
              }
            };

            const formattedPerformedAt = formatToInputDate(maintDetails.performed_at);
            const formattedNextDueDate = maintDetails.next_due_date
              ? formatToInputDate(maintDetails.next_due_date)
              : null;

            setFormData({
              service: maintDetails.service || '',
              description: maintDetails.description || '',
              performed_at: formattedPerformedAt,
              status: STATUSES.includes(maintDetails.status) ? maintDetails.status : 'ativa',
              next_due_date: formattedNextDueDate,
              next_due_usage_limit: maintDetails.next_due_usage_limit?.toString() || null,
              next_due_usage_current: maintDetails.next_due_usage_current?.toString() || null,
              usage_unit: loadedUsageUnit,
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
            setError('Maintenance details not found or could not be processed.');
            setFormData(initialFormData);
            setPredictionType('none');
          }
        } catch (err) {
          if (err instanceof Error) setError(err.message);
          else if (typeof err === 'string') setError(err);
          else setError('An error occurred while fetching maintenance details.');
          setFormData(initialFormData);
          setPredictionType('none');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchMaintenance();
    }
  }, [assetId, maintenanceId, isEditMode, navigate]);

  const handlePredictionTypeChange = (event: SelectChangeEvent<PredictionType>) => {
    const newType = event.target.value as PredictionType;
    setPredictionType(newType);
    setFormData(prev => {
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
    if (name === 'usage_unit') {
      if (value && USAGE_UNITS.includes(value)) {
        processedValue = value;
      } else {
        processedValue = null;
      }
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.service.trim()) {
      setError('Serviço é obrigatório.');
      setSubmitLoading(false);
      return;
    }

    const currentStatus = STATUSES.includes(formData.status) ? formData.status : 'ativa';
    const currentUsageUnit = formData.usage_unit;

    const payload: MaintenancePayload = {
      service: formData.service,
      description: formData.description || null,
      performed_at: formData.performed_at || null,
      status: currentStatus,
      next_due_date: null,
      next_due_usage_limit: null,
      next_due_usage_current: null,
      usage_unit: null,
    };

    if (predictionType === 'date' && formData.next_due_date) {
      payload.next_due_date = formData.next_due_date;
    } else if (predictionType === 'usage') {
      const limitStr = formData.next_due_usage_limit;
      const currentStr = formData.next_due_usage_current;
      if (limitStr && limitStr.trim() !== '' && !isNaN(parseInt(limitStr, 10))) {
        payload.next_due_usage_limit = parseInt(limitStr, 10);
      }
      if (currentStr && currentStr.trim() !== '' && !isNaN(parseInt(currentStr, 10))) {
        payload.next_due_usage_current = parseInt(currentStr, 10);
      }
      payload.usage_unit = currentUsageUnit;
    }

    if (payload.status === 'ativa') {
      const hasValidDatePrediction = predictionType === 'date' && payload.next_due_date;
      const hasValidUsagePrediction =
        predictionType === 'usage' &&
        typeof payload.next_due_usage_limit === 'number' &&
        typeof payload.next_due_usage_current === 'number' &&
        payload.usage_unit;

      if (predictionType === 'none') {
        setError('Manutenções ativas requerem uma previsão. Selecione "Por Data" ou "Por Uso".');
        setSubmitLoading(false);
        return;
      }
      if (predictionType === 'date' && !hasValidDatePrediction) {
        setError(
          'Para previsão "Por Data", a "Próxima Data Prevista" é obrigatória para manutenções ativas.'
        );
        setSubmitLoading(false);
        return;
      }
      if (predictionType === 'usage' && !hasValidUsagePrediction) {
        setError(
          'Para previsão "Por Uso", todos os três campos (limite, atual, e unidade) são obrigatórios para manutenções ativas.'
        );
        setSubmitLoading(false);
        return;
      }
    }

    if (predictionType === 'usage') {
      const filledUsageFieldsCount = [
        payload.next_due_usage_limit,
        payload.next_due_usage_current,
        payload.usage_unit,
      ].filter(
        field =>
          field !== null &&
          field !== undefined &&
          (typeof field === 'number' || (typeof field === 'string' && field.trim() !== ''))
      ).length;
      if (filledUsageFieldsCount > 0 && filledUsageFieldsCount < 3) {
        setError(
          'Se fornecer previsão "Por Uso", todos os três campos (limite, atual, e unidade) são obrigatórios.'
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
        let errorMsg = `Falha ao ${isEditMode ? 'atualizar' : 'criar'} manutenção`;
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
      setSuccess(`Manutenção ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      setTimeout(() => {
        navigate(`/assets/${assetId}/maintenances`);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError(`Ocorreu um erro ao ${isEditMode ? 'atualizar' : 'criar'} a manutenção.`);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (fetchLoading && isEditMode) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/assets/${assetId}/maintenances`)}
        sx={{ my: 2 }}
      >
        Voltar para Manutenções
      </Button>
      <Paper sx={{ p: 3, mt: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Editar Manutenção' : 'Adicionar Nova Manutenção'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
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
                label="Serviço Realizado / A Ser Realizado"
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
                label="Descrição (Opcional)"
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
                label="Realizado Em"
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
                  {STATUSES.map(s => (
                    <MenuItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 0.5 }}>
                Próxima Previsão
              </Typography>
              <FormControl fullWidth margin="dense" disabled={submitLoading}>
                <InputLabel id="prediction-type-label">Tipo de Previsão</InputLabel>
                <Select
                  labelId="prediction-type-label"
                  value={predictionType}
                  label="Tipo de Previsão"
                  onChange={handlePredictionTypeChange}
                >
                  <MenuItem value="none">Sem Previsão</MenuItem>
                  <MenuItem value="date">Por Data</MenuItem>
                  <MenuItem value="usage">Por Uso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {predictionType === 'date' && (
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <TextField
                  margin="dense"
                  fullWidth
                  id="next_due_date"
                  label="Próxima Data Prevista"
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
                    label="Próximo Limite de Uso"
                    name="next_due_usage_limit"
                    type="number"
                    value={formData.next_due_usage_limit || ''}
                    onChange={handleChange}
                    disabled={submitLoading}
                    required
                    InputProps={{
                      inputProps: { min: 0 },
                      onWheel: event => (event.target as HTMLElement).blur(),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ mt: 1 }}>
                  <TextField
                    margin="dense"
                    fullWidth
                    id="next_due_usage_current"
                    label="Uso Atual"
                    name="next_due_usage_current"
                    type="number"
                    value={formData.next_due_usage_current || ''}
                    onChange={handleChange}
                    disabled={submitLoading}
                    required
                    InputProps={{
                      inputProps: { min: 0 },
                      onWheel: event => (event.target as HTMLElement).blur(),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ mt: 1 }}>
                  <FormControl fullWidth margin="dense" disabled={submitLoading} required>
                    <InputLabel id="usage_unit-label">Unidade de Uso</InputLabel>
                    <Select
                      labelId="usage_unit-label"
                      id="usage_unit"
                      name="usage_unit"
                      value={formData.usage_unit || ''}
                      label="Unidade de Uso"
                      onChange={handleChange}
                    >
                      <MenuItem value="">
                        <em>Nenhuma</em>
                      </MenuItem>
                      {USAGE_UNITS.map(u => (
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
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isEditMode ? (
                'Salvar Alterações'
              ) : (
                'Criar Manutenção'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MaintenanceForm;
