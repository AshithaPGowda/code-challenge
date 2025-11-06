'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  IconButton,
  Tooltip,
  TableSortLabel,
  Typography
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  VerifiedUser as VerifyIcon
} from '@mui/icons-material';
import { I9Form, I9FormStatus } from '@/lib/types';
import { useState } from 'react';

interface I9TableProps {
  forms: I9Form[];
  loading?: boolean;
  onView: (form: I9Form) => void;
  onApprove: (form: I9Form) => void;
  onReject: (form: I9Form) => void;
  onVerify: (form: I9Form) => void;
  onDownloadPdf: (form: I9Form) => void;
}

type SortOrder = 'asc' | 'desc';

const getStatusChipProps = (status: I9FormStatus) => {
  switch (status) {
    case I9FormStatus.COMPLETED:
      return { color: 'primary' as const, label: 'Pending Review' };
    case I9FormStatus.NEEDS_CORRECTION:
      return { color: 'warning' as const, label: 'Needs Correction' };
    case I9FormStatus.DATA_APPROVED:
      return { color: 'secondary' as const, label: 'Data Approved' };
    case I9FormStatus.VERIFIED:
      return { color: 'success' as const, label: 'Verified' };
    case I9FormStatus.IN_PROGRESS:
      return { color: 'info' as const, label: 'In Progress' };
    default:
      return { color: 'default' as const, label: status };
  }
};

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function I9Table({
  forms,
  loading = false,
  onView,
  onApprove,
  onReject,
  onVerify,
  onDownloadPdf
}: I9TableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedForms = [...forms].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading forms...</Typography>
      </Box>
    );
  }

  if (forms.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="textSecondary">
          No I-9 forms found
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Forms will appear here as employees complete them via voice calls
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Employee Name
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Phone
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Email
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight={600}>
                Status
              </Typography>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={true}
                direction={sortOrder}
                onClick={handleSort}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Submitted Date
                </Typography>
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <Typography variant="subtitle2" fontWeight={600}>
                Actions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedForms.map((form) => {
            const statusProps = getStatusChipProps(form.status);
            
            return (
              <TableRow key={form.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {form.first_name} {form.last_name}
                  </Typography>
                  {form.middle_initial && (
                    <Typography variant="caption" color="textSecondary">
                      Middle: {form.middle_initial}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {form.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {form.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusProps.label}
                    color={statusProps.color}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(form.created_at)}
                  </Typography>
                  {form.completed_at && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      Completed: {formatDate(form.completed_at)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1} justifyContent="center">
                    {/* Always show View button */}
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onView(form)}
                        color="primary"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Status-specific action buttons */}
                    {form.status === I9FormStatus.COMPLETED && (
                      <>
                        <Tooltip title="Approve Data">
                          <IconButton
                            size="small"
                            onClick={() => onApprove(form)}
                            color="success"
                          >
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Request Corrections">
                          <IconButton
                            size="small"
                            onClick={() => onReject(form)}
                            color="warning"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    {form.status === I9FormStatus.DATA_APPROVED && (
                      <Tooltip title="Verify Final">
                        <IconButton
                          size="small"
                          onClick={() => onVerify(form)}
                          color="secondary"
                        >
                          <VerifyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {form.status === I9FormStatus.VERIFIED && (
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          onClick={() => onDownloadPdf(form)}
                          color="primary"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}