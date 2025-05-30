import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'; // MUI Grid
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import StarIcon from '@mui/icons-material/Star';
import { useTheme } from '@mui/material/styles';

interface Asset {
  id: string;
  name: string;
  description: string;
  importance: number;
}

const NUMBER_OF_IMPORTANT_ASSETS_TO_SHOW = 5;

const LandingPage = () => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  const fetchAllAssets = useCallback(async () => {
    setLoadingAssets(true);
    setAssetError(null);
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        let errorMsg = 'Failed to fetch assets for dashboard';
        try {
          const data = await response.json();
          if (data && data.error) errorMsg = data.error;
          else if (data && data.message) errorMsg = data.message;
        } catch (parseErr) {
          console.warn('Could not parse error response JSON (fetchAllAssets):', parseErr);
        }
        throw new Error(errorMsg);
      }
      const responseData = await response.json();
      let fetchedAssets: Asset[] = [];
      if (responseData && Array.isArray(responseData.asset)) {
        fetchedAssets = responseData.asset;
      } else if (Array.isArray(responseData)) {
        fetchedAssets = responseData;
      } else {
        console.warn('Unexpected data structure for assets:', responseData);
      }
      setAllAssets(fetchedAssets);
    } catch (err: unknown) {
      if (err instanceof Error) setAssetError(err.message);
      else setAssetError('An unexpected error occurred while fetching assets.');
      setAllAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllAssets();
  }, [fetchAllAssets]);

  const importantAssets = useMemo(() => {
    if (!Array.isArray(allAssets)) return [];
    return [...allAssets]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, NUMBER_OF_IMPORTANT_ASSETS_TO_SHOW);
  }, [allAssets]);

  const getImportanceLabelAndColor = (
    importance: number
  ): { label: string; color: 'error' | 'warning' | 'info' | 'success' | 'default' } => {
    switch (importance) {
      case 5:
        return { label: 'Very High', color: 'error' };
      case 4:
        return { label: 'High', color: 'warning' };
      case 3:
        return { label: 'Medium', color: 'info' };
      case 2:
        return { label: 'Low', color: 'success' };
      case 1:
        return { label: 'Very Low', color: 'default' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Welcome to AssetManager
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" paragraph align="center">
          Manage your assets and their maintenance schedules efficiently.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button variant="contained" color="primary" component={RouterLink} to="/assets">
            View All My Assets
          </Button>
          <Button variant="outlined" color="primary" component={RouterLink} to="/assets/new">
            Add New Asset
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ textAlign: { xs: 'center', md: 'left' } }}
        >
          Important Assets
        </Typography>
        {loadingAssets && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {assetError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setAssetError(null)}>
            {assetError}
          </Alert>
        )}
        {!loadingAssets && !assetError && importantAssets.length === 0 && allAssets.length > 0 && (
          <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
            No assets currently marked with high importance to display here.
          </Typography>
        )}
        {!loadingAssets && !assetError && allAssets.length === 0 && (
          <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
            You have no assets yet.{' '}
            <RouterLink
              to="/assets/new"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Add your first asset!
            </RouterLink>
          </Typography>
        )}
        {!loadingAssets && !assetError && importantAssets.length > 0 && (
          <Grid container spacing={3}>
            {' '}
            {importantAssets.map(asset => {
              const importanceStyle = getImportanceLabelAndColor(asset.importance);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={asset.id}>
                  <Card
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography
                          gutterBottom
                          variant="h5"
                          component="div"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flexGrow: 1,
                            pr: 1,
                          }}
                        >
                          {asset.name}
                        </Typography>
                        <Tooltip title={`Importance: ${importanceStyle.label}`}>
                          <Chip
                            icon={<StarIcon fontSize="small" />}
                            label={asset.importance.toString()}
                            color={importanceStyle.color}
                            size="small"
                          />
                        </Tooltip>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: '3.6em',
                          mb: 1,
                        }}
                      >
                        {asset.description || 'No description available.'}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-start', pt: 0, mt: 'auto' }}>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/assets/${asset.id}/maintenances`}
                      >
                        View Maintenances
                      </Button>
                      <Button size="small" component={RouterLink} to={`/assets/${asset.id}`}>
                        Edit Asset
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default LandingPage;
