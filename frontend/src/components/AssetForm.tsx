// frontend/src/components/AssetForm.tsx

import { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import type { FormEvent } from 'react'; // Já deve estar assim
import { useParams, useNavigate } from 'react-router'; // Corrigido para react-router-dom
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select'; // Já deve estar assim
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
// Grid não está sendo usado, removi o import se estava lá por engano em alguma versão anterior.

interface AssetFormData {
  name: string;
  description: string;
  importance: string;
}

// Para o payload da API, pode ser útil ter um tipo separado se for diferente do FormData
interface AssetPayload {
  name: string;
  description: string;
  importance: number;
}

const AssetForm = () => {
  const { id: assetId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(assetId);

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    importance: '3',
  });
  const [loading, setLoading] = useState(false); // Loading para fetch inicial
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false); // Loading para o submit do formulário

  const fetchAsset = useCallback(async () => {
    if (isEditMode && assetId) {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/assets/${assetId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/login');
            return;
          }
          let errorMsg = 'Failed to fetch asset details';
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (_parseError) {
            /* Ignore */
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        const assetData = data.body || data;
        setFormData({
          name: assetData.name,
          description: assetData.description,
          importance: assetData.importance.toString(),
        });
      } catch (err: unknown) {
        // <--- CORRIGIDO E PADRONIZADO
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === 'string') {
          setError(err);
        } else {
          setError('An unexpected error occurred while fetching asset details.');
        }
      } finally {
        setLoading(false);
      }
    }
  }, [assetId, isEditMode, navigate]); // Dependências do useCallback

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]); // useEffect depende da função memoizada

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

    const payload: AssetPayload = {
      // Usando o tipo AssetPayload
      name: formData.name,
      description: formData.description,
      importance: parseInt(formData.importance, 10),
    };

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode ? `/api/assets/${assetId}` : '/api/assets';
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
        let errorMsg = `Failed to ${isEditMode ? 'update' : 'create'} asset`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) errorMsg = errorData.message;
        } catch (_parseError) {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }
      navigate('/assets');
    } catch (err: unknown) {
      // <--- CORRIGIDO
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

  if (loading) {
    // Loading para o fetch inicial dos dados do asset em modo de edição
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Asset' : 'Create New Asset'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
            disabled={submitLoading} // Desabilitado durante o submit do formulário
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
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/assets')}
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
