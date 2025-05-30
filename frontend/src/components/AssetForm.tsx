import { useState, useEffect, useCallback } from 'react';
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
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

interface AssetFormData {
  name: string;
  description: string;
  importance: string;
}

interface AssetPayload {
  name: string;
  description?: string;
  importance: number;
}

interface Asset {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  importance: number;
  created_at?: string;
  updated_at?: string;
}

const AssetForm = () => {
  const { id: assetIdParam } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(assetIdParam);

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    importance: '3',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAsset = useCallback(async () => {
    if (isEditMode && assetIdParam) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/assets/${assetIdParam}`);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/login');
            return;
          }
          let errorMsg = 'Failed to fetch asset details';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) errorMsg = errorData.error;
            else if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (_parseError) {
            /* Ignore */
          }
          throw new Error(errorMsg);
        }
        const responseData = await response.json();

        let assetParaFormulario: Asset | undefined = undefined;

        if (responseData && Array.isArray(responseData.asset) && responseData.asset.length > 0) {
          assetParaFormulario = responseData.asset[0];
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          !Array.isArray(responseData) &&
          responseData.id
        ) {
          assetParaFormulario = responseData as Asset;
        }

        if (
          assetParaFormulario &&
          typeof assetParaFormulario.importance !== 'undefined' &&
          assetParaFormulario.importance !== null
        ) {
          setFormData({
            name: assetParaFormulario.name || '',
            description: assetParaFormulario.description || '',
            importance: assetParaFormulario.importance.toString(),
          });
        } else {
          console.error(
            'AssetForm (fetchAsset) - Asset não encontrado ou campo "importance" ausente:',
            assetParaFormulario
          );
          setError('Failed to load asset details correctly (missing data or importance).');
          setFormData({ name: '', description: '', importance: '3' });
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An unexpected error occurred while fetching asset details.');
        }

        setFormData({ name: '', description: '', importance: '3' });
      } finally {
        setLoading(false);
      }
    }
  }, [assetIdParam, isEditMode, navigate]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitLoading(true);
    setError(null);

    if (!formData.name.trim()) {
      setError('Asset Name is required.');
      setSubmitLoading(false);
      return;
    }

    const payload: AssetPayload = {
      name: formData.name,
      description: formData.description,
      importance: parseInt(formData.importance, 10),
    };

    try {
      const url = isEditMode ? `/api/assets/${assetIdParam}` : '/api/assets';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `Failed to ${isEditMode ? 'update' : 'create'} asset`;
        try {
          const errorData = await response.json();
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
        } catch (_parseError) {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }
      navigate('/assets');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError(
          `An unexpected error occurred while ${isEditMode ? 'updating' : 'creating'} asset.`
        );
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

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
        {' '}
        {/* Padding responsivo */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
          {isEditMode ? 'Edit Asset' : 'Create New Asset'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Asset Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={submitLoading}
            autoFocus={!isEditMode}
          />
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            disabled={submitLoading}
          />
          <FormControl fullWidth margin="normal" required disabled={submitLoading}>
            <InputLabel id="importance-label">Importance</InputLabel>
            <Select
              labelId="importance-label"
              id="importance"
              name="importance"
              value={formData.importance}
              label="Importance"
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5].map(val => (
                <MenuItem key={val} value={val.toString()}>
                  {val} -{' '}
                  {val === 1
                    ? 'Very Low'
                    : val === 2
                    ? 'Low'
                    : val === 3
                    ? 'Medium'
                    : val === 4
                    ? 'High'
                    : 'Very High'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {' '}
            {/* Adicionado gap */}
            <Button variant="outlined" onClick={() => navigate('/assets')} disabled={submitLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Asset'
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AssetForm;
