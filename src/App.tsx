import { Box, Container, Typography } from '@mui/material';
import UnsubscribeTable from '@/components/UnsubscribeTable';

export default function App() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Unsubscribe Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Below is a list of unsubscribe links fetched from your mailbox (demo data for now).
      </Typography>
      <Box>
        <UnsubscribeTable />
      </Box>
    </Container>
  );
}
