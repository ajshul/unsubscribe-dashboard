import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close, Launch, Email, CalendarToday, Person } from '@mui/icons-material';
import { format } from 'date-fns';
import { gmailAPI, UnsubscribeEmail } from '@/utils/api';
import DOMPurify from 'dompurify';

interface EmailViewerModalProps {
  open: boolean;
  onClose: () => void;
  email: UnsubscribeEmail | null;
  onUnsubscribe: (email: UnsubscribeEmail, unsubscribeUrl: string) => void;
}

interface EmailDetails {
  id: string;
  subject: string;
  sender: string;
  date: string;
  body: string;
  headers: Record<string, string>;
}

const EmailViewerModal: React.FC<EmailViewerModalProps> = ({
  open,
  onClose,
  email,
  onUnsubscribe
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [emailDetails, setEmailDetails] = useState<EmailDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && email) {
      fetchEmailDetails();
    }
  }, [open, email]);

  const fetchEmailDetails = async () => {
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const response = await gmailAPI.getEmailDetails(email.id);
      setEmailDetails(response.data);
    } catch (error: any) {
      console.error('Failed to fetch email details:', error);
      setError('Failed to load email details');
    } finally {
      setLoading(false);
    }
  };

  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'div',
        'span',
        'a',
        'img',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'table',
        'tr',
        'td',
        'th',
        'thead',
        'tbody',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'center'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class'],
      ALLOW_DATA_ATTR: false
    });
  };

  const handleUnsubscribeClick = (unsubscribeUrl: string) => {
    if (email) {
      onUnsubscribe(email, unsubscribeUrl);
    }
  };

  if (!email) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          minHeight: fullScreen ? '100vh' : '80vh',
          bgcolor: 'background.default'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email color="primary" />
          <Typography variant="h6" component="div" noWrap>
            Email Preview
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
            flexDirection="column"
            gap={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading email content...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : (
          <Box>
            {/* Email Header */}
            <Box
              sx={{ p: 3, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
            >
              <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word' }}>
                {emailDetails?.subject || email.subject}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {emailDetails?.sender || email.sender}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(emailDetails?.date || email.date), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
              </Box>

              {/* Unsubscribe Links */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Unsubscribe options:
                </Typography>
                {email.unsubscribeLinks?.map((link, index) => (
                  <Chip
                    key={index}
                    label={link.source}
                    size="small"
                    variant="outlined"
                    color={link.source === 'header' ? 'primary' : 'secondary'}
                    onClick={() => handleUnsubscribeClick(link.url)}
                    icon={<Launch fontSize="small" />}
                    clickable
                  />
                ))}
              </Box>
            </Box>

            <Divider />

            {/* Email Content */}
            <Box sx={{ p: 3 }}>
              {emailDetails?.body ? (
                <Box
                  sx={{
                    '& img': { maxWidth: '100%', height: 'auto' },
                    '& table': { maxWidth: '100%', overflow: 'auto' },
                    '& a': { color: theme.palette.primary.main },
                    fontFamily: theme.typography.body1.fontFamily,
                    fontSize: theme.typography.body1.fontSize,
                    lineHeight: theme.typography.body1.lineHeight,
                    color: theme.palette.text.primary
                  }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHTML(emailDetails.body)
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {email.snippet || 'No preview available'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<Launch />}
          onClick={() => {
            if (email && email.unsubscribeLinks[0] && email.unsubscribeLinks.length > 0) {
              handleUnsubscribeClick(email.unsubscribeLinks[0].url);
            }
          }}
          disabled={!email || !email.unsubscribeLinks || email.unsubscribeLinks.length === 0}
        >
          Unsubscribe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailViewerModal;
