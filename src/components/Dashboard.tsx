import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Container, Grid, Typography, Skeleton } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeMode } from '@/contexts/ThemeContext';
import UnsubscribeTable from './UnsubscribeTable';
import StatsCards from './StatsCards';
import Header from './Header';
import CommandPalette from './CommandPalette';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'senders'>('table');

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleToggleView = () => {
    setViewMode(prev => (prev === 'table' ? 'senders' : 'table'));
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command Palette (Cmd/Ctrl + K)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Refresh (Ctrl/Cmd + R)
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }

      // Toggle View (Ctrl/Cmd + Shift + V)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        handleToggleView();
      }

      // Toggle Theme (Ctrl/Cmd + Shift + T)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        toggleMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

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
            <UnsubscribeTable
              refreshTrigger={refreshTrigger}
              viewMode={viewMode}
              onToggleView={handleToggleView}
            />
          </CardContent>
        </Card>
      </Container>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onRefresh={handleRefresh}
        onToggleView={handleToggleView}
        onToggleTheme={toggleMode}
        viewMode={viewMode}
        isDarkMode={mode === 'dark'}
      />
    </Box>
  );
};

export default Dashboard;
