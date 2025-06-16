import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
  Alert
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/utils/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Login: isAuthenticated changed:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Login: User is authenticated, navigating to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('Login: URL params:', {
      code: code ? code.substring(0, 20) + '...' : null,
      error
    });

    if (error) {
      setError('Authentication was cancelled or failed. Please try again.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      console.log('Login: Found OAuth code, processing callback...');
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    console.log('Login: handleGoogleCallback started');
    setLoading(true);
    setError(null);

    // Clear the URL parameters immediately to prevent reprocessing
    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      console.log('Login: Calling login with code:', code.substring(0, 20) + '...');
      const user = await login(code);
      console.log('Login: Login returned user:', user);

      // Check if user was actually set
      if (!user) {
        throw new Error('Login returned no user data');
      }

      console.log('Login: Waiting a moment before navigation...');
      // Add a small delay to ensure state updates propagate
      setTimeout(() => {
        console.log('Login: Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Login: Login error:', error);
      const errorMessage =
        error.response?.data?.error || error.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Login: Starting Google login flow');
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.getGoogleAuthUrl();
      console.log('Login: Got auth URL, redirecting...');
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      console.error('Login: Failed to get auth URL:', error);
      setError('Failed to initialize login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            📩 Unsubscribe Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Quickly find and manage all your email subscriptions in one place. Sign in with Google
            to get started.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <Google />}
            onClick={handleGoogleLogin}
            disabled={loading}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              By signing in, you agree to let this app access your Gmail to find unsubscribe links.
              We only read emails and never send or modify anything.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
