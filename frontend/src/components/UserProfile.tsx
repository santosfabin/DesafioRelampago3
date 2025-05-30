import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface UserFormData {
  name: string;
  email: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserApiResponse {
  user: User[];
}

interface UserProfileProps {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

const UserProfile = ({ setIsAuthenticated }: UserProfileProps) => {
  const [initialUserData, setInitialUserData] = useState<{ name: string; email: string } | null>(
    null
  );
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setFetchLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users/');
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) navigate('/login');
          let errorMsg = 'Failed to fetch user data';
          try {
            const d = await response.json();
            if (d && d.error && typeof d.error === 'string') errorMsg = d.error;
            else if (d && d.error && d.error.error && typeof d.error.error === 'string')
              errorMsg = d.error.error;
            else if (d && d.message) errorMsg = d.message;
          } catch (pErr) {
            console.warn('No JSON in user fetch err', pErr);
          }
          throw new Error(errorMsg);
        }
        const rData: UserApiResponse = await response.json();
        if (rData && Array.isArray(rData.user) && rData.user.length > 0) {
          const cUserData = rData.user[0];
          setFormData(p => ({
            ...p,
            name: cUserData.name || '',
            email: cUserData.email || '',
            newPassword: '',
            confirmNewPassword: '',
          }));
          setInitialUserData({ name: cUserData.name || '', email: cUserData.email || '' });
        } else {
          throw new Error('User data not found in API response.');
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else if (typeof err === 'string') setError(err);
        else setError('Could not load user profile.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    interface UpdatePayload {
      name?: string;
      email?: string;
      password?: string;
    }
    const payload: UpdatePayload = {};
    let hasChanges = false;

    if (
      initialUserData &&
      formData.name.trim() !== initialUserData.name &&
      formData.name.trim() !== ''
    ) {
      payload.name = formData.name.trim();
      hasChanges = true;
    }
    if (
      initialUserData &&
      formData.email.trim() !== initialUserData.email &&
      formData.email.trim() !== ''
    ) {
      payload.email = formData.email.trim();
      hasChanges = true;
    }
    if (formData.newPassword && formData.newPassword.trim() !== '') {
      payload.password = formData.newPassword;
      hasChanges = true;
    }
    if (!hasChanges) {
      setError('No changes to save.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let errMsg = 'Failed to update profile.';
        try {
          const eData = await response.json();
          if (eData && eData.error && typeof eData.error === 'string') errMsg = eData.error;
          else if (
            eData &&
            eData.error &&
            eData.error.error &&
            typeof eData.error.error === 'string'
          )
            errMsg = eData.error.error;
          else if (eData && eData.message) errMsg = eData.message;
        } catch (pErr) {
          console.warn('No JSON in profile update err', pErr);
          if (response.statusText) errMsg = response.statusText;
        }
        throw new Error(errMsg);
      }
      const uUserData = await response.json();
      setSuccess('Profile updated successfully!');
      let uName = formData.name;
      let uEmail = formData.email;
      if (uUserData && Array.isArray(uUserData.user) && uUserData.user.length > 0) {
        const uUser = uUserData.user[0];
        uName = uUser.name || formData.name;
        uEmail = uUser.email || formData.email;
      } else if (uUserData && uUserData.name && uUserData.email) {
        uName = uUserData.name || formData.name;
        uEmail = uUserData.email || formData.email;
      }
      if (payload.name) uName = payload.name;
      if (payload.email) uEmail = payload.email;
      setFormData({ name: uName, email: uEmail, newPassword: '', confirmNewPassword: '' });
      setInitialUserData({ name: uName, email: uEmail });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('Failed to update profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/users', { method: 'DELETE' });
      if (!response.ok) {
        let backendErrorMessage = 'Failed to delete account.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.error && typeof errorData.error === 'string')
            backendErrorMessage = errorData.error;
          else if (
            errorData &&
            errorData.error &&
            errorData.error.error &&
            typeof errorData.error.error === 'string'
          )
            backendErrorMessage = errorData.error.error;
          else if (errorData && errorData.message) backendErrorMessage = errorData.message;
        } catch (parseErr) {
          console.warn('Could not parse error JSON from delete account API:', parseErr);
          if (response.statusText) backendErrorMessage = response.statusText;
        }
        throw new Error(backendErrorMessage);
      }

      setIsAuthenticated(false);

      alert('Your account has been successfully deleted.');
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) setDeleteError(err.message);
      else if (typeof err === 'string') setDeleteError(err);
      else setDeleteError('An unexpected error occurred while deleting your account.');
    } finally {
      setDeleteLoading(false);
    }
    setOpenDeleteConfirm(false);
  };

  const handleClickOpenDeleteConfirm = () => {
    setOpenDeleteConfirm(true);
    setDeleteError(null);
  };
  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
  };

  if (fetchLoading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Account Settings
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

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="name"
                label="Name"
                fullWidth
                value={formData.name}
                onChange={handleChange}
                disabled={submitLoading || fetchLoading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="email"
                label="Email Address"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                disabled={submitLoading || fetchLoading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mt: 1, mb: -1 }}>
                Change Password (optional)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                fullWidth
                value={formData.newPassword || ''}
                onChange={handleChange}
                disabled={submitLoading || fetchLoading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="confirmNewPassword"
                label="Confirm New Password"
                type="password"
                fullWidth
                value={formData.confirmNewPassword || ''}
                onChange={handleChange}
                disabled={submitLoading || fetchLoading}
                error={
                  !!(
                    formData.newPassword &&
                    formData.confirmNewPassword &&
                    formData.newPassword !== formData.confirmNewPassword
                  )
                }
                helperText={
                  formData.newPassword &&
                  formData.confirmNewPassword &&
                  formData.newPassword !== formData.confirmNewPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={submitLoading || fetchLoading}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClickOpenDeleteConfirm}
            disabled={submitLoading || fetchLoading || deleteLoading}
          >
            Delete My Account
          </Button>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </Box>
      </Paper>

      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>{'Confirm Account Deletion'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you absolutely sure you want to delete your account? All of your assets and
            maintenance records will be permanently removed. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="primary" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            autoFocus
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Yes, Delete My Account'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
