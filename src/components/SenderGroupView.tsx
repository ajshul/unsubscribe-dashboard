import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Launch,
  CheckCircle,
  Unsubscribe,
  Email,
  Archive,
  Person
} from '@mui/icons-material';
import { format } from 'date-fns';
import { UnsubscribeEmail } from '@/utils/api';

interface SenderGroup {
  sender: string;
  emails: UnsubscribeEmail[];
  totalEmails: number;
  latestDate: string;
  unsubscribeLinks: Array<{ source: 'header' | 'body'; url: string }>;
}

interface SenderGroupViewProps {
  emails: UnsubscribeEmail[];
  unsubscribedIds: Set<string>;
  onUnsubscribe: (email: UnsubscribeEmail, unsubscribeUrl: string) => void;
  onViewEmail: (email: UnsubscribeEmail) => void;
  onBulkUnsubscribe: (senderGroup: SenderGroup) => void;
  loading?: boolean;
}

const SenderGroupView: React.FC<SenderGroupViewProps> = ({
  emails,
  unsubscribedIds,
  onUnsubscribe,
  onViewEmail,
  onBulkUnsubscribe,
  loading = false
}) => {
  const [expandedSenders, setExpandedSenders] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState<Set<string>>(new Set());

  const senderGroups = useMemo(() => {
    const groups = new Map<string, SenderGroup>();

    emails.forEach(email => {
      const senderKey = email.sender;

      if (!groups.has(senderKey)) {
        groups.set(senderKey, {
          sender: senderKey,
          emails: [],
          totalEmails: 0,
          latestDate: email.date,
          unsubscribeLinks: []
        });
      }

      const group = groups.get(senderKey)!;
      group.emails.push(email);
      group.totalEmails++;

      // Keep the latest date
      if (new Date(email.date) > new Date(group.latestDate)) {
        group.latestDate = email.date;
      }

      // Collect unique unsubscribe links
      email.unsubscribeLinks.forEach(link => {
        if (!group.unsubscribeLinks.some(existing => existing.url === link.url)) {
          group.unsubscribeLinks.push(link);
        }
      });
    });

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [emails]);

  const toggleExpanded = (sender: string) => {
    const newExpanded = new Set(expandedSenders);
    if (newExpanded.has(sender)) {
      newExpanded.delete(sender);
    } else {
      newExpanded.add(sender);
    }
    setExpandedSenders(newExpanded);
  };

  const handleBulkUnsubscribe = async (group: SenderGroup) => {
    setBulkProcessing(prev => new Set(prev).add(group.sender));
    try {
      await onBulkUnsubscribe(group);
    } finally {
      setBulkProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(group.sender);
        return newSet;
      });
    }
  };

  const getGroupStatus = (group: SenderGroup) => {
    const unsubscribedCount = group.emails.filter(email => unsubscribedIds.has(email.id)).length;

    if (unsubscribedCount === 0) return 'active';
    if (unsubscribedCount === group.totalEmails) return 'unsubscribed';
    return 'partial';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unsubscribed':
        return 'success';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string, unsubscribedCount: number, total: number) => {
    switch (status) {
      case 'unsubscribed':
        return 'All Unsubscribed';
      case 'partial':
        return `${unsubscribedCount}/${total} Unsubscribed`;
      default:
        return 'Active';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Grouping emails by sender...
        </Typography>
      </Box>
    );
  }

  if (senderGroups.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No email senders found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Sender View:</strong> Emails are grouped by sender. Use bulk actions to
          unsubscribe from all emails from a sender at once.
        </Typography>
      </Alert>

      <List sx={{ p: 0 }}>
        {senderGroups.map(group => {
          const isExpanded = expandedSenders.has(group.sender);
          const status = getGroupStatus(group);
          const unsubscribedCount = group.emails.filter(email =>
            unsubscribedIds.has(email.id)
          ).length;
          const isProcessing = bulkProcessing.has(group.sender);

          return (
            <Card key={group.sender} sx={{ mb: 2 }} elevation={1}>
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton onClick={() => toggleExpanded(group.sender)} size="small">
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" noWrap>
                      {group.sender}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.totalEmails} email{group.totalEmails !== 1 ? 's' : ''} • Latest:{' '}
                      {format(new Date(group.latestDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusText(status, unsubscribedCount, group.totalEmails)}
                      color={getStatusColor(status)}
                      size="small"
                    />

                    {status !== 'unsubscribed' && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Unsubscribe />}
                        onClick={() => handleBulkUnsubscribe(group)}
                        disabled={isProcessing || group.unsubscribeLinks.length === 0}
                        sx={{ minWidth: 120 }}
                      >
                        {isProcessing ? 'Processing...' : 'Unsubscribe All'}
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Unsubscribe Links Preview */}
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {group.unsubscribeLinks.slice(0, 3).map((link, index) => (
                    <Chip
                      key={index}
                      label={link.source}
                      size="small"
                      variant="outlined"
                      color={link.source === 'header' ? 'primary' : 'secondary'}
                    />
                  ))}
                  {group.unsubscribeLinks.length > 3 && (
                    <Chip
                      label={`+${group.unsubscribeLinks.length - 3} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 2, pl: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Individual Emails:
                    </Typography>

                    <List dense>
                      {group.emails.map(email => (
                        <ListItem
                          key={email.id}
                          sx={{
                            opacity: unsubscribedIds.has(email.id) ? 0.6 : 1,
                            bgcolor: unsubscribedIds.has(email.id) ? 'action.hover' : 'transparent',
                            borderRadius: 1,
                            mb: 0.5
                          }}
                        >
                          <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />

                          <ListItemText
                            primary={
                              <Typography variant="body2" noWrap>
                                {email.subject}
                              </Typography>
                            }
                            secondary={format(new Date(email.date), 'MMM dd, yyyy')}
                          />

                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => onViewEmail(email)}
                              color="secondary"
                            >
                              <Email />
                            </IconButton>

                            {email.unsubscribeLinks.map((link, linkIndex) => (
                              <IconButton
                                key={linkIndex}
                                size="small"
                                onClick={() => onUnsubscribe(email, link.url)}
                                disabled={unsubscribedIds.has(email.id)}
                                color="primary"
                              >
                                {unsubscribedIds.has(email.id) ? <CheckCircle /> : <Launch />}
                              </IconButton>
                            ))}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </List>
    </Box>
  );
};

export default SenderGroupView;
