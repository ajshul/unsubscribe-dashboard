import {
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useEffect, useState } from 'react';

type Row = {
  id: string;
  sender: string;
  subject: string;
  link: string;
};

const seed: Row[] = [
  {
    id: '1',
    sender: 'Awesome Newsletter',
    subject: 'Welcome to issue #42',
    link: 'https://example.com/unsubscribe?token=abc'
  },
  {
    id: '2',
    sender: 'Another Promo',
    subject: 'Super deals await',
    link: 'https://promo.com/unsubscribe'
  }
];

export default function UnsubscribeTable() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setRows(seed);
  }, []);

  return (
    <TableContainer component={Paper} elevation={3}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Sender</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Unsubscribe</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.sender}</TableCell>
              <TableCell>{r.subject}</TableCell>
              <TableCell>
                <Link href={r.link} target="_blank" rel="noopener">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
