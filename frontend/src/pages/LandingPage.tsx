import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
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

interface Maintenance {
  id: string;
  asset_id: string;
  service: string;
  description?: string | null;
  performed_at?: string | null;
  status: string;
  next_due_date?: string | null;
  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: string | null;
  _nextDueDisplay?: string;
}

interface UrgentMaintenanceItem extends Maintenance {
  assetName: string;
  assetImportance: number;
  urgencyScore: number;
  urgencyText: string;
  dueDisplay: string;
}

const NUMBER_OF_IMPORTANT_ASSETS_TO_SHOW = 5;
const NUMBER_OF_URGENT_MAINTENANCES_TO_SHOW = 10;

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

const formatNextDueForDisplay = (maint: Maintenance): string => {
  if (maint.next_due_date) {
    try {
      return new Date(maint.next_due_date).toLocaleDateString();
    } catch (e) {
      return 'Data Inválida';
    }
  }
  if (maint.next_due_usage_limit !== null && maint.next_due_usage_limit !== undefined) {
    const unitDisplay = maint.usage_unit
      ? maint.usage_unit.charAt(0).toUpperCase() + maint.usage_unit.slice(1)
      : '';
    return `${maint.next_due_usage_current || 0}/${
      maint.next_due_usage_limit
    } ${unitDisplay}`.trim();
  }
  return 'N/A';
};

const LandingPage = () => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  const [upcomingMaintenances, setUpcomingMaintenances] = useState<UrgentMaintenanceItem[]>([]);
  const [loadingMaintenances, setLoadingMaintenances] = useState(true);
  const [maintenancePanelError, setMaintenancePanelError] = useState<string | null>(null);

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
        let errorMsg = 'Failed to fetch assets';
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

  const fetchAndProcessMaintenances = useCallback(
    async (assets: Asset[]) => {
      if (!assets || assets.length === 0) {
        setUpcomingMaintenances([]);
        setLoadingMaintenances(false);
        return;
      }
      setLoadingMaintenances(true);
      setMaintenancePanelError(null);
      const allPendingMaintenances: UrgentMaintenanceItem[] = [];

      try {
        const maintenancePromises = assets.map(asset =>
          fetch(`/api/assets/${asset.id}/maintenances`)
            .then(res => {
              if (!res.ok) {
                console.warn(
                  `Failed to fetch maintenances for asset ${asset.id}, status: ${res.status}`
                );
                return { asset, maintenancesData: null };
              }
              return res.json().then(data => ({ asset, maintenancesData: data }));
            })
            .catch(err => {
              console.error(`Error fetching maintenances for asset ${asset.id}:`, err);
              return { asset, maintenancesData: null };
            })
        );

        const results = await Promise.all(maintenancePromises);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        results.forEach(result => {
          const { asset, maintenancesData } = result;
          let maintenancesForAsset: Maintenance[] = [];

          if (
            maintenancesData &&
            typeof maintenancesData === 'object' &&
            maintenancesData !== null
          ) {
            const keyHoldingTheArray = 'maintenance';

            if (
              keyHoldingTheArray in maintenancesData &&
              Array.isArray((maintenancesData as Record<string, unknown>)[keyHoldingTheArray])
            ) {
              maintenancesForAsset = (maintenancesData as Record<string, Maintenance[]>)[
                keyHoldingTheArray
              ];
            } else if (Array.isArray(maintenancesData)) {
              maintenancesForAsset = maintenancesData as Maintenance[];
            } else {
              console.warn(
                `Expected '${keyHoldingTheArray}' to be an array in maintenancesData for asset ${asset.id}:`,
                maintenancesData
              );
            }
          } else if (maintenancesData === null) {
            //
          } else if (maintenancesData) {
            console.warn(
              `Unexpected type for maintenancesData for asset ${asset.id}:`,
              maintenancesData
            );
          }

          maintenancesForAsset.forEach(maint => {
            if (maint.status !== 'ativa') {
              return;
            }

            let urgencyScore = Infinity;
            let urgencyText = '';
            const dueDisplay = formatNextDueForDisplay(maint);
            if (maint.next_due_date) {
              const dueDate = new Date(maint.next_due_date);
              dueDate.setHours(0, 0, 0, 0);
              const diffTime = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              urgencyScore = diffDays;
              if (diffDays < 0) urgencyText = `Atrasada (${Math.abs(diffDays)}d)`;
              else if (diffDays === 0) urgencyText = 'Hoje!';
              else if (diffDays === 1) urgencyText = 'Amanhã';
              else if (diffDays <= 7) urgencyText = `Em ${diffDays} dias`;
              else urgencyText = `Vence em ${diffDays} dias`;
            } else if (
              maint.next_due_usage_limit &&
              maint.next_due_usage_current !== null &&
              maint.next_due_usage_current !== undefined
            ) {
              const limit = maint.next_due_usage_limit;
              const current = maint.next_due_usage_current;
              const remaining = limit - current;
              const percentage = limit > 0 ? (current / limit) * 100 : 0;
              const unit = maint.usage_unit
                ? maint.usage_unit.charAt(0).toUpperCase() + maint.usage_unit.slice(1)
                : '';
              if (remaining <= 0) {
                urgencyScore = -1000 - Math.abs(remaining);
                urgencyText = `Uso Excedido! (${Math.abs(remaining)} ${unit} além)`;
              } else if (percentage >= 95) {
                urgencyScore = -500 + remaining;
                urgencyText = `Próximo (${remaining} ${unit} rest.) - ${percentage.toFixed(0)}%`;
              } else if (percentage >= 80) {
                urgencyScore = -200 + remaining;
                urgencyText = `Atenção (${remaining} ${unit} rest.) - ${percentage.toFixed(0)}%`;
              } else {
                urgencyScore = remaining + 10000;
                urgencyText = `Ok (${remaining} ${unit} rest.) - ${percentage.toFixed(0)}%`;
              }
            } else {
              return;
            }

            allPendingMaintenances.push({
              ...maint,
              assetName: asset.name,
              assetImportance: asset.importance,
              urgencyScore,
              urgencyText,
              dueDisplay,
            });
          });
        });
        allPendingMaintenances.sort((a, b) => {
          if (a.urgencyScore !== b.urgencyScore) return a.urgencyScore - b.urgencyScore;
          return b.assetImportance - a.assetImportance;
        });
        setUpcomingMaintenances(
          allPendingMaintenances.slice(0, NUMBER_OF_URGENT_MAINTENANCES_TO_SHOW)
        );
      } catch (err: unknown) {
        console.error('Error processing maintenances for dashboard:', err);
        if (err instanceof Error) setMaintenancePanelError(err.message);
        else
          setMaintenancePanelError(
            'An unexpected error occurred while preparing upcoming maintenances.'
          );
      } finally {
        setLoadingMaintenances(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (allAssets.length > 0 && !loadingAssets) {
      fetchAndProcessMaintenances(allAssets);
    } else if (!loadingAssets && allAssets.length === 0) {
      setUpcomingMaintenances([]);
      setLoadingMaintenances(false);
    }
  }, [allAssets, loadingAssets, fetchAndProcessMaintenances]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Seção de Boas Vindas */}
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

      {/* Painel de Ativos Importantes */}
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

      {/* Painel de Manutenções Próximas/Urgentes */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ textAlign: { xs: 'center', md: 'left' } }}
        >
          Upcoming & Urgent Maintenances
        </Typography>
        {loadingMaintenances && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {maintenancePanelError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setMaintenancePanelError(null)}>
            {maintenancePanelError}
          </Alert>
        )}
        {!loadingMaintenances &&
          !maintenancePanelError &&
          upcomingMaintenances.length === 0 &&
          allAssets.length > 0 && (
            <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
              No upcoming maintenances needing immediate attention, or no active maintenances with
              predictions found.
            </Typography>
          )}
        {!loadingMaintenances &&
          !maintenancePanelError &&
          upcomingMaintenances.length === 0 &&
          allAssets.length === 0 &&
          !loadingAssets && (
            <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center' }}>
              Add assets and their maintenance schedules to see upcoming tasks.
            </Typography>
          )}
        {!loadingMaintenances && !maintenancePanelError && upcomingMaintenances.length > 0 && (
          <Grid container spacing={2}>
            {upcomingMaintenances.map(maint => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={maint.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderLeft:
                      maint.urgencyScore < 0
                        ? `5px solid ${theme.palette.error.main}`
                        : maint.urgencyScore <= 7
                        ? `5px solid ${theme.palette.warning.main}`
                        : `5px solid ${theme.palette.info.main}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      {maint.assetName}
                    </Typography>
                    <Typography
                      variant="h6"
                      component="div"
                      noWrap
                      title={maint.service}
                      sx={{ mb: 0.5 }}
                    >
                      {maint.service}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', mb: 1.5 }} color="text.secondary">
                      Status:{' '}
                      {maint.status
                        ? maint.status.charAt(0).toUpperCase() + maint.status.slice(1)
                        : 'N/A'}
                    </Typography>
                    <Box mb={1}>
                      <Typography variant="body2" component="span">
                        <strong>Due:</strong> {maint.dueDisplay}
                      </Typography>
                    </Box>
                    <Chip
                      label={maint.urgencyText}
                      size="small"
                      color={
                        maint.urgencyScore < 0
                          ? 'error'
                          : maint.urgencyScore <= 7
                          ? 'warning'
                          : maint.urgencyScore <= 30
                          ? 'info'
                          : 'default'
                      }
                      sx={{ fontWeight: 'medium' }}
                    />
                  </CardContent>
                  <CardActions sx={{ mt: 'auto' }}>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/assets/${maint.asset_id}/maintenances/${maint.id}`}
                    >
                      View/Edit Maintenance
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default LandingPage;
