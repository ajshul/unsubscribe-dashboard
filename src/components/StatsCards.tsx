import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import { Email, UnsubscribeOutlined, TrendingDown, Schedule } from '@mui/icons-material';
import { gmailAPI, EmailStats } from '@/utils/api';

interface StatsCardsProps {
  refreshTrigger?: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await gmailAPI.getStats();
        setStats(response.data);
      } catch (error: any) {
        console.error('Failed to fetch stats:', error);
        setError(error.response?.data?.error || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  const cards = [
    {
      title: 'Total Inbox Emails',
      value: stats?.totalInboxEmails || 0,
      icon: <Email sx={{ fontSize: 40 }} />,
      color: 'primary.main',
      description: 'Emails in your inbox'
    },
    {
      title: 'Unsubscribe Emails Found',
      value: stats?.unsubscribeEmailsCount || 0,
      icon: <UnsubscribeOutlined sx={{ fontSize: 40 }} />,
      color: 'warning.main',
      description: 'Emails with unsubscribe links'
    },
    {
      title: 'Cleanup Potential',
      value: stats
        ? Math.round((stats.unsubscribeEmailsCount / Math.max(stats.totalInboxEmails, 1)) * 100)
        : 0,
      suffix: '%',
      icon: <TrendingDown sx={{ fontSize: 40 }} />,
      color: 'success.main',
      description: 'Percentage of emails you can unsubscribe from'
    },
    {
      title: 'Last Updated',
      value: stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : '--:--',
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: 'info.main',
      description: 'When data was last refreshed'
    }
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3
        }}
      >
        {[...Array(4)].map((_, index) => (
          <Card elevation={2} key={index}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
              <Skeleton variant="text" width="80%" />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 3
      }}
    >
      {cards.map((card, index) => (
        <Card
          key={index}
          elevation={2}
          sx={{
            height: '100%',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            }
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${card.color.replace('.main', '')}.light`,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {card.icon}
              </Box>
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography variant="h4" component="div" color={card.color}>
                  {card.value.toLocaleString()}
                  {card.suffix || ''}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom>
              {card.title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {card.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default StatsCards;
