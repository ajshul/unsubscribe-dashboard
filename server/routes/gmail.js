import express from 'express';
import { google } from 'googleapis';
import { authenticateToken, getUserTokens } from './auth.js';

const router = express.Router();

// Rate limiting store (in production, use Redis)
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  const userId = req.user.userId;
  const now = Date.now();

  if (!userRequestCounts.has(userId)) {
    userRequestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const userLimit = userRequestCounts.get(userId);

  if (now > userLimit.resetTime) {
    userRequestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making more requests.'
    });
  }

  userLimit.count++;
  next();
};

// Parse unsubscribe links from email headers and body
const parseUnsubscribeLinks = (headers, body) => {
  const links = [];

  // Check List-Unsubscribe header
  const listUnsubscribe = headers['list-unsubscribe'];
  if (listUnsubscribe) {
    const headerLinks = listUnsubscribe.match(/<([^>]+)>/g);
    if (headerLinks) {
      headerLinks.forEach(link => {
        const url = link.slice(1, -1); // Remove < >
        if (url.startsWith('http')) {
          links.push({ source: 'header', url });
        }
      });
    }
  }

  // Parse HTML body for unsubscribe links
  if (body) {
    const htmlContent = body.includes('<html') ? body : '';
    if (htmlContent) {
      // Common unsubscribe link patterns
      const patterns = [
        /href=["']([^"']*unsubscribe[^"']*)["']/gi,
        /href=["']([^"']*opt[_-]?out[^"']*)["']/gi,
        /href=["']([^"']*remove[_-]?me[^"']*)["']/gi,
        /href=["']([^"']*manage[_-]?subscription[^"']*)["']/gi
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(htmlContent)) !== null) {
          const url = match[1];
          if (url.startsWith('http') && !links.some(l => l.url === url)) {
            links.push({ source: 'body', url });
          }
        }
      });
    }
  }

  return links;
};

// Get authenticated Gmail client
const getGmailClient = userId => {
  const tokens = getUserTokens(userId);
  if (!tokens) {
    throw new Error('User tokens not found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.VITE_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Fetch unsubscribe emails
router.get('/unsubscribe-emails', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 50, sender, includeArchived = 'false' } = req.query;
    const gmail = getGmailClient(req.user.userId);

    // Search for emails with unsubscribe links - more comprehensive query
    // Include archived emails if requested (for "Show Unsubscribed" feature)
    let locationQuery = includeArchived === 'true' ? '' : 'in:inbox ';
    let query =
      locationQuery +
      '(has:unsubscribe OR "unsubscribe" OR "opt out" OR "opt-out" OR "remove me" OR "manage subscription" OR "email preferences" OR "notification settings" OR "list-unsubscribe")';
    if (sender) {
      query += ` from:${sender}`;
    }

    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: parseInt(limit),
      pageToken: page > 1 ? req.query.pageToken : undefined
    });

    if (!listResponse.data.messages) {
      return res.json({
        emails: [],
        totalCount: 0,
        nextPageToken: null
      });
    }

    // Fetch detailed message data
    const emailPromises = listResponse.data.messages
      .slice(0, parseInt(limit))
      .map(async message => {
        try {
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const msg = messageResponse.data;
          const headers = {};

          // Parse headers
          msg.payload?.headers?.forEach(header => {
            headers[header.name.toLowerCase()] = header.value;
          });

          // Get email body
          let body = '';
          const getBodyFromParts = parts => {
            if (!parts) return '';

            for (const part of parts) {
              if (part.mimeType === 'text/html' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
              } else if (part.parts) {
                const nestedBody = getBodyFromParts(part.parts);
                if (nestedBody) return nestedBody;
              }
            }
            return '';
          };

          if (msg.payload?.body?.data) {
            body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
          } else if (msg.payload?.parts) {
            body = getBodyFromParts(msg.payload.parts);
          }

          // Parse unsubscribe links
          const unsubscribeLinks = parseUnsubscribeLinks(headers, body);

          return {
            id: msg.id,
            threadId: msg.threadId,
            sender: headers['from'] || 'Unknown',
            subject: headers['subject'] || 'No Subject',
            date: new Date(parseInt(msg.internalDate)).toISOString(),
            unsubscribeLinks,
            snippet: msg.snippet || ''
          };
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return null;
        }
      });

    const emails = (await Promise.all(emailPromises)).filter(
      email => email && email.unsubscribeLinks.length > 0
    );

    res.json({
      emails,
      totalCount: listResponse.data.resultSizeEstimate || 0,
      nextPageToken: listResponse.data.nextPageToken || null
    });
  } catch (error) {
    console.error('Error fetching emails:', error);

    if (error.code === 401) {
      return res.status(401).json({ error: 'Gmail access token expired. Please re-authenticate.' });
    }

    res.status(500).json({
      error: 'Failed to fetch emails',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get email statistics
router.get('/stats', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const gmail = getGmailClient(req.user.userId);

    // Get inbox count
    const inboxResponse = await gmail.users.labels.get({
      userId: 'me',
      id: 'INBOX'
    });

    // Get unsubscribe emails count (approximate) - using same comprehensive query
    const unsubscribeResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox (has:unsubscribe OR "unsubscribe" OR "opt out" OR "opt-out" OR "remove me" OR "manage subscription" OR "email preferences" OR "notification settings" OR "list-unsubscribe")',
      maxResults: 1
    });

    res.json({
      totalInboxEmails: inboxResponse.data.messagesTotal || 0,
      unsubscribeEmailsCount: unsubscribeResponse.data.resultSizeEstimate || 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Mark unsubscribe link as used and optionally archive
router.post('/mark-unsubscribed', authenticateToken, async (req, res) => {
  try {
    const { emailId, unsubscribeUrl, shouldArchive = false } = req.body;

    if (!emailId || !unsubscribeUrl) {
      return res.status(400).json({ error: 'Email ID and unsubscribe URL required' });
    }

    const gmail = getGmailClient(req.user.userId);
    let archivedSuccessfully = false;

    // Archive the thread if requested
    if (shouldArchive) {
      try {
        // Get the thread ID first
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: emailId,
          format: 'metadata'
        });

        const threadId = messageResponse.data.threadId;

        // Archive the entire thread
        await gmail.users.threads.modify({
          userId: 'me',
          id: threadId,
          requestBody: {
            removeLabelIds: ['INBOX'],
            addLabelIds: ['UNREAD'] // Keep it unread but archived
          }
        });

        archivedSuccessfully = true;
      } catch (archiveError) {
        console.error('Failed to archive thread:', archiveError);
        // Don't fail the entire request if archiving fails
      }
    }

    // In a production app, you might want to store this in a database
    res.json({
      success: true,
      message: 'Unsubscribe action recorded',
      emailId,
      unsubscribeUrl,
      archived: archivedSuccessfully,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking unsubscribed:', error);
    res.status(500).json({ error: 'Failed to record unsubscribe action' });
  }
});

// Get detailed email content
router.get('/email/:emailId', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { emailId } = req.params;
    const gmail = getGmailClient(req.user.userId);

    const messageResponse = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });

    const msg = messageResponse.data;
    const headers = {};

    // Parse headers
    msg.payload?.headers?.forEach(header => {
      headers[header.name.toLowerCase()] = header.value;
    });

    // Get email body
    let body = '';
    const getBodyFromParts = parts => {
      if (!parts) return '';

      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          const nestedBody = getBodyFromParts(part.parts);
          if (nestedBody) return nestedBody;
        }
      }
      return '';
    };

    if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
    } else if (msg.payload?.parts) {
      body = getBodyFromParts(msg.payload.parts);
    }

    res.json({
      id: msg.id,
      subject: headers['subject'] || 'No Subject',
      sender: headers['from'] || 'Unknown',
      date: new Date(parseInt(msg.internalDate)).toISOString(),
      body,
      headers
    });
  } catch (error) {
    console.error('Error fetching email details:', error);

    if (error.code === 401) {
      return res.status(401).json({ error: 'Gmail access token expired. Please re-authenticate.' });
    }

    res.status(500).json({
      error: 'Failed to fetch email details',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

export default router;
