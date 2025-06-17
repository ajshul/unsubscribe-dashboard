import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// OAuth redirect URI should be consistent
const redirectUri =
  process.env.NODE_ENV === 'production'
    ? `${process.env.VITE_APP_URL}/login`
    : 'http://localhost:5173/login';

console.log('Auth: OAuth redirect URI:', redirectUri);

const client = new OAuth2Client(
  process.env.VITE_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

// Store for user sessions (in production, use Redis or database)
const userSessions = new Map();

// Middleware to verify JWT tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Google OAuth URL generation
router.get('/google', (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'select_account'
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    console.log('Auth: Received OAuth callback request');
    const { code } = req.body;
    console.log('Auth: Code received:', code ? code.substring(0, 20) + '...' : 'No code');

    if (!code) {
      console.error('Auth: No authorization code provided');
      return res.status(400).json({ error: 'Authorization code required' });
    }

    console.log('Auth: Exchanging code for tokens...');
    const { tokens } = await client.getToken(code);
    console.log('Auth: Tokens received:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      id_token: tokens.id_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing'
    });

    client.setCredentials(tokens);

    // Get user info
    console.log('Auth: Verifying ID token...');
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    console.log('Auth: User payload received:', {
      userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture ? 'present' : 'missing'
    });

    // Store user session
    console.log('Auth: Storing user session...');
    userSessions.set(userId, {
      ...tokens,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      loginTime: new Date()
    });

    // Generate JWT
    console.log('Auth: Generating JWT token...');
    const jwtToken = jwt.sign(
      {
        userId,
        email: payload.email,
        name: payload.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Auth: JWT token generated successfully');
    const responseData = {
      token: jwtToken,
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      }
    };

    console.log('Auth: Sending success response:', {
      token: 'present',
      user: responseData.user
    });

    res.json(responseData);
  } catch (error) {
    console.error('Auth: OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  try {
    const userSession = userSessions.get(req.user.userId);

    if (!userSession) {
      return res.status(401).json({ error: 'Session not found' });
    }

    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        picture: userSession.picture
      }
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    userSessions.delete(req.user.userId);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get user tokens (for internal use)
export const getUserTokens = userId => {
  return userSessions.get(userId);
};

export default router;
