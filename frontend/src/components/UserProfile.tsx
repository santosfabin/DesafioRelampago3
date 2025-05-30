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

const UserProfile = () => {
  const [initialUserData, setInitialUserData] = useState<{ name: string; email: string } | null>(
    null
  );
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',

    newPassword: '',
    confirmNewPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

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
            const errorData = await response.json();
            if (errorData && errorData.error && typeof errorData.error === 'string')
              errorMsg = errorData.error;
            else if (
              errorData &&
              errorData.error &&
              errorData.error.error &&
              typeof errorData.error.error === 'string'
            )
              errorMsg = errorData.error.error;
            else if (errorData && errorData.message) errorMsg = errorData.message;
          } catch (parseErr) {
            console.warn('Could not parse error JSON from user data API:', parseErr);
          }
          throw new Error(errorMsg);
        }
        const responseData: UserApiResponse = await response.json();
        if (responseData && Array.isArray(responseData.user) && responseData.user.length > 0) {
          const currentUserData = responseData.user[0];
          setFormData(prev => ({
            ...prev,
            name: currentUserData.name || '',
            email: currentUserData.email || '',
          }));
          setInitialUserData({
            name: currentUserData.name || '',
            email: currentUserData.email || '',
          });
        } else {
          throw new Error('User data not found in API response.');
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else if (typeof err === 'string') setError(err);
        else setError('Could not load user profile due to an unexpected error.');
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
    let hasNonPasswordChanges = false;

    if (initialUserData && formData.name.trim() !== initialUserData.name) {
      payload.name = formData.name.trim();
      hasNonPasswordChanges = true;
    }
    if (initialUserData && formData.email.trim() !== initialUserData.email) {
      payload.email = formData.email.trim();
      hasNonPasswordChanges = true;
    }

    if (formData.newPassword && formData.newPassword.trim() !== '') {
      payload.password = formData.newPassword;
    }

    if (!hasNonPasswordChanges && !payload.password) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let backendErrorMessage = 'Failed to update profile.';
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
          console.warn('Could not parse error JSON from profile update API:', parseErr);
          if (response.statusText) backendErrorMessage = response.statusText;
        }
        throw new Error(backendErrorMessage);
      }

      const updatedUserDataResponse = await response.json();
      setSuccess('Profile updated successfully!');

      let updatedName = formData.name;
      let updatedEmail = formData.email;

      if (
        updatedUserDataResponse &&
        Array.isArray(updatedUserDataResponse.user) &&
        updatedUserDataResponse.user.length > 0
      ) {
        const updatedUser = updatedUserDataResponse.user[0];
        updatedName = updatedUser.name || formData.name;
        updatedEmail = updatedUser.email || formData.email;
      } else if (
        updatedUserDataResponse &&
        updatedUserDataResponse.name &&
        updatedUserDataResponse.email
      ) {
        updatedName = updatedUserDataResponse.name || formData.name;
        updatedEmail = updatedUserDataResponse.email || formData.email;
      }

      if (payload.name) updatedName = payload.name;
      if (payload.email) updatedEmail = payload.email;

      setFormData({
        name: updatedName,
        email: updatedEmail,
        newPassword: '',
        confirmNewPassword: '',
      });
      setInitialUserData({ name: updatedName, email: updatedEmail });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('Failed to update profile due to an unexpected error.');
    } finally {
      setLoading(false);
    }
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mt: 4 }}>
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
                disabled={loading || fetchLoading}
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
                disabled={loading || fetchLoading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mt: 1, mb: -1 }}>
                Change Password (optional)
              </Typography>
            </Grid>
            {/* CAMPO "CURRENT PASSWORD" REMOVIDO
            <Grid size={{ xs: 12 }}>
              <TextField name="currentPassword" label="Current Password" type="password" fullWidth value={formData.currentPassword || ''} onChange={handleChange} disabled={loading || fetchLoading} helperText="Required if changing password"/>
            </Grid>
            */}
            <Grid size={{ xs: 12 }}>
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                fullWidth
                value={formData.newPassword || ''}
                onChange={handleChange}
                disabled={loading || fetchLoading}
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
                disabled={loading || fetchLoading}
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
            disabled={loading || fetchLoading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserProfile;
