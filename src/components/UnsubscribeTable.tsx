import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { CheckCircle, Launch, OpenInNew, Refresh, Search } from '@mui/icons-material';
import { format } from 'date-fns';
import { gmailAPI, UnsubscribeEmail } from '@/utils/api';

interface UnsubscribeTableProps {
  refreshTrigger?: number;
}

const UnsubscribeTable: React.FC<UnsubscribeTableProps> = ({ refreshTrigger = 0 }) => {
  const [emails, setEmails] = useState<UnsubscribeEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchSender, setSearchSender] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [unsubscribedIds, setUnsubscribedIds] = useState<Set<string>>(new Set());

  const fetchEmails = useCallback(
    async (pageNum = 0, sender = '') => {
      setLoading(true);
      setError(null);
      try {
        const response = await gmailAPI.getUnsubscribeEmails({
          page: pageNum + 1,
          limit: rowsPerPage,
          sender: sender || undefined,
          pageToken: pageNum > 0 ? nextPageToken || undefined : undefined
        });

        let sortedEmails = response.data.emails;

        // Sort emails
        if (sortBy === 'date') {
          sortedEmails.sort(
            (a: UnsubscribeEmail, b: UnsubscribeEmail) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        } else if (sortBy === 'sender') {
          sortedEmails.sort((a: UnsubscribeEmail, b: UnsubscribeEmail) =>
            a.sender.localeCompare(b.sender)
          );
        }

        setEmails(sortedEmails);
        setTotalCount(response.data.totalCount);
        setNextPageToken(response.data.nextPageToken || null);
      } catch (error: any) {
        console.error('Failed to fetch emails:', error);
        setError(error.response?.data?.error || 'Failed to fetch emails. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [rowsPerPage, nextPageToken, sortBy]
  );

  useEffect(() => {
    fetchEmails(page, searchSender);
  }, [page, searchSender, sortBy, refreshTrigger]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUnsubscribeClick = async (email: UnsubscribeEmail, unsubscribeUrl: string) => {
    try {
      await gmailAPI.markUnsubscribed(email.id, unsubscribeUrl);
      setUnsubscribedIds(prev => new Set(prev).add(email.id));

      // Open unsubscribe link in new tab
      window.open(unsubscribeUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to mark as unsubscribed:', error);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    fetchEmails(0, searchSender);
  };

  if (loading && emails.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Fetching your emails...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3}>
      {/* Controls */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search by sender"
            variant="outlined"
            size="small"
            value={searchSender}
            onChange={e => setSearchSender(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={e => setSortBy(e.target.value as 'date' | 'sender')}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="sender">Sender</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sender</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Unsubscribe Links</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {emails.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No unsubscribe emails found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              emails.map(email => (
                <TableRow
                  key={email.id}
                  sx={{
                    opacity: unsubscribedIds.has(email.id) ? 0.6 : 1,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {email.sender}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={email.subject}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {email.subject}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(email.date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {email.unsubscribeLinks.map((link, index) => (
                        <Chip
                          key={index}
                          label={link.source}
                          size="small"
                          variant="outlined"
                          color={link.source === 'header' ? 'primary' : 'secondary'}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {email.unsubscribeLinks.map((link, index) => (
                        <Tooltip key={index} title={`Open ${link.source} unsubscribe link`}>
                          <IconButton
                            size="small"
                            onClick={() => handleUnsubscribeClick(email, link.url)}
                            disabled={unsubscribedIds.has(email.id)}
                            color="primary"
                          >
                            {unsubscribedIds.has(email.id) ? <CheckCircle /> : <Launch />}
                          </IconButton>
                        </Tooltip>
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default UnsubscribeTable;
