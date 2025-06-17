import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  ListItemButton
} from '@mui/material';
import {
  Search,
  Refresh,
  Launch,
  Visibility,
  ViewList,
  Group,
  Settings,
  Archive,
  CheckCircle,
  DarkMode,
  LightMode,
  Email
} from '@mui/icons-material';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  category: 'Navigation' | 'Actions' | 'View' | 'Settings';
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onToggleView: () => void;
  onToggleTheme: () => void;
  viewMode: 'table' | 'senders';
  isDarkMode: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onRefresh,
  onToggleView,
  onToggleTheme,
  viewMode,
  isDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'refresh',
        label: 'Refresh Emails',
        description: 'Reload emails from Gmail',
        icon: <Refresh />,
        shortcut: 'Ctrl+R',
        category: 'Actions',
        action: () => {
          onRefresh();
          onClose();
        }
      },
      {
        id: 'toggle-view',
        label: viewMode === 'table' ? 'Switch to Sender View' : 'Switch to Table View',
        description: viewMode === 'table' ? 'Group emails by sender' : 'Show individual emails',
        icon: viewMode === 'table' ? <Group /> : <ViewList />,
        shortcut: 'Ctrl+Shift+V',
        category: 'View',
        action: () => {
          onToggleView();
          onClose();
        }
      },
      {
        id: 'toggle-theme',
        label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle between light and dark themes',
        icon: isDarkMode ? <LightMode /> : <DarkMode />,
        shortcut: 'Ctrl+Shift+T',
        category: 'Settings',
        action: () => {
          onToggleTheme();
          onClose();
        }
      },
      {
        id: 'focus-search',
        label: 'Focus Search',
        description: 'Focus the sender search input',
        icon: <Search />,
        shortcut: 'Ctrl+F',
        category: 'Navigation',
        action: () => {
          onClose();
          setTimeout(() => {
            const searchInput = document.querySelector(
              'input[placeholder*="Search"]'
            ) as HTMLInputElement | null;
            if (searchInput) {
              searchInput.focus();
            }
          }, 100);
        }
      },
      {
        id: 'open-settings',
        label: 'Settings',
        description: 'Open application settings',
        icon: <Settings />,
        category: 'Navigation',
        action: () => {
          console.log('Settings not implemented yet');
          onClose();
        }
      }
    ],
    [viewMode, isDarkMode, onRefresh, onToggleView, onToggleTheme, onClose]
  );

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;

    return commands.filter(
      command =>
        command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        command.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [commands, searchQuery]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};

    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category]?.push(command);
    });

    return groups;
  }, [filteredCommands]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          filteredCommands[selectedIndex]?.action();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const searchInput = document.querySelector(
          '#command-palette-search'
        ) as HTMLInputElement | null;
        searchInput?.focus();
      }, 100);
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 2,
          maxHeight: '70vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            id="command-palette-search"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              sx: { fontSize: '16px' }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' }
              }
            }}
          />
        </Box>

        {/* Commands List */}
        <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {Object.keys(groupedCommands).length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No commands found matching "{searchQuery}"
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands], categoryIndex) => (
              <Box key={category}>
                {categoryIndex > 0 && <Divider />}

                <Typography
                  variant="overline"
                  sx={{
                    px: 2,
                    py: 1,
                    display: 'block',
                    color: 'text.secondary',
                    fontWeight: 600
                  }}
                >
                  {category}
                </Typography>

                <List dense sx={{ py: 0 }}>
                  {categoryCommands.map(command => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <ListItem key={command.id} disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={command.action}
                          sx={{
                            '&.Mui-selected': {
                              bgcolor: 'action.selected',
                              '&:hover': {
                                bgcolor: 'action.selected'
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>{command.icon}</ListItemIcon>

                          <ListItemText
                            primary={command.label}
                            secondary={command.description}
                            sx={{ flex: 1 }}
                          />

                          {command.shortcut && (
                            <Chip
                              label={command.shortcut}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.75rem',
                                height: 24,
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))
          )}
        </Box>

        {/* Footer Help */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 2 }}>
            <Box component="span">↑↓ Navigate</Box>
            <Box component="span">↵ Select</Box>
            <Box component="span">Esc Close</Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
