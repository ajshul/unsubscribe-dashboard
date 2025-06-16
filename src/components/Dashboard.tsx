import React, { useState } from 'react';
import { Box, Card, CardContent, Container, Grid, Typography, Skeleton } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import UnsubscribeTable from './UnsubscribeTable';
import StatsCards from './StatsCards';
import Header from './Header';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onRefresh={handleRefresh} />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here are all the unsubscribe links found in your Gmail inbox. Click any link to open it
            and unsubscribe from that sender.
          </Typography>
        </Box>

        {/* Stats Section */}
        <Box sx={{ mb: 4 }}>
          <StatsCards refreshTrigger={refreshTrigger} />
        </Box>

        {/* Main Table Section */}
        <Card elevation={1}>
          <CardContent sx={{ p: 0 }}>
            <UnsubscribeTable refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Dashboard;
