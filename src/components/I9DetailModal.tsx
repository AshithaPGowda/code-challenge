'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as ApproveIcon,
  Edit as EditIcon,
  VerifiedUser as VerifyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { I9Form, I9FormStatus, CitizenshipStatus } from '@/lib/types';
import { useState } from 'react';
import CorrectionNotesDialog from './CorrectionNotesDialog';

interface I9DetailModalProps {
  open: boolean;
  form: I9Form | null;
  onClose: () => void;
  onApprove: (form: I9Form) => void;
  onReject: (form: I9Form, notes: string) => void;
  onVerify: (form: I9Form) => void;
  onDownloadPdf: (form: I9Form) => void;
  loading?: boolean;
}

const getCitizenshipStatusDisplay = (status: CitizenshipStatus) => {
  switch (status) {
    case 'us_citizen':
      return { label: 'U.S. Citizen', color: 'success' as const };
    case 'lawful_permanent_resident':
      return { label: 'Lawful Permanent Resident', color: 'primary' as const };
    case 'authorized_alien':
      return { label: 'Authorized Alien', color: 'secondary' as const };
    default:
      return { label: status, color: 'default' as const };
  }
};

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function I9DetailModal({
  open,
  form,
  onClose,
  onApprove,
  onReject,
  onVerify,
  onDownloadPdf,
  loading = false
}: I9DetailModalProps) {
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);

  if (!form) return null;

  const citizenshipDisplay = getCitizenshipStatusDisplay(form.citizenship_status);

  const handleRejectClick = () => {
    setCorrectionDialogOpen(true);
  };

  const handleCorrectionSubmit = (notes: string) => {
    onReject(form, notes);
    setCorrectionDialogOpen(false);
    onClose();
  };

  const InfoField = ({ label, value }: { label: string; value: string | undefined }) => (
    <Box mb={2}>
      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value || 'Not provided'}
      </Typography>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            minHeight: '70vh',
            backgroundColor: '#fff',
            zIndex: 1300
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1299
          }
        }}
        sx={{
          zIndex: 1301
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" component="div">
              I-9 Form Details
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Personal Information */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Personal Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box flex="1" minWidth="200px">
                      <InfoField label="First Name" value={form.first_name} />
                    </Box>
                    <Box flex="1" minWidth="200px">
                      <InfoField label="Last Name" value={form.last_name} />
                    </Box>
                    <Box flex="1" minWidth="200px">
                      <InfoField label="Middle Initial" value={form.middle_initial} />
                    </Box>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box flex="1" minWidth="250px">
                      <InfoField label="Other Last Names" value={form.other_last_names} />
                    </Box>
                    <Box flex="1" minWidth="250px">
                      <InfoField label="Date of Birth" value={formatDate(form.date_of_birth)} />
                    </Box>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box flex="1" minWidth="250px">
                      <InfoField label="Social Security Number" value={form.ssn ? '***-**-' + form.ssn.slice(-4) : undefined} />
                    </Box>
                    <Box flex="1" minWidth="250px">
                      <InfoField label="Employee ID" value={form.employee_id} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Address Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box flex="2" minWidth="300px">
                      <InfoField label="Street Address" value={form.address} />
                    </Box>
                    <Box flex="1" minWidth="150px">
                      <InfoField label="Apartment Number" value={form.apt_number} />
                    </Box>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box flex="1" minWidth="150px">
                      <InfoField label="City" value={form.city} />
                    </Box>
                    <Box flex="1" minWidth="100px">
                      <InfoField label="State" value={form.state} />
                    </Box>
                    <Box flex="1" minWidth="120px">
                      <InfoField label="ZIP Code" value={form.zip_code} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Contact Information
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box flex="1" minWidth="250px">
                    <InfoField label="Email Address" value={form.email} />
                  </Box>
                  <Box flex="1" minWidth="250px">
                    <InfoField label="Phone Number" value={form.phone} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Citizenship Status */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Citizenship Status
                </Typography>
                <Box mb={2}>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    Citizenship/Immigration Status
                  </Typography>
                  <Chip
                    label={citizenshipDisplay.label}
                    color={citizenshipDisplay.color}
                    variant="filled"
                    size="medium"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Form Status & Timestamps */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Form Status & Timeline
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box flex="1" minWidth="250px">
                    <InfoField label="Created" value={formatDateTime(form.created_at)} />
                  </Box>
                  <Box flex="1" minWidth="250px">
                    <InfoField label="Last Updated" value={formatDateTime(form.updated_at)} />
                  </Box>
                  {form.completed_at && (
                    <Box flex="1" minWidth="250px">
                      <InfoField label="Completed" value={formatDateTime(form.completed_at)} />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Employer Notes (if any) */}
            {form.status === I9FormStatus.NEEDS_CORRECTION && form.employer_notes && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Correction Notes:
                </Typography>
                <Typography variant="body2">
                  {form.employer_notes}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          {/* Status-based action buttons */}
          {form.status === I9FormStatus.COMPLETED && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ApproveIcon />}
                onClick={() => onApprove(form)}
                disabled={loading}
              >
                {loading ? 'Approving...' : 'Approve Data'}
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<EditIcon />}
                onClick={handleRejectClick}
                disabled={loading}
              >
                Request Corrections
              </Button>
            </>
          )}

          {form.status === I9FormStatus.DATA_APPROVED && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <VerifyIcon />}
              onClick={() => onVerify(form)}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Final'}
            </Button>
          )}

          {form.status === I9FormStatus.VERIFIED && (
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={() => onDownloadPdf(form)}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Download PDF'}
            </Button>
          )}

          <Button 
            variant="outlined" 
            onClick={onClose}
            disabled={loading}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <CorrectionNotesDialog
        open={correctionDialogOpen}
        onClose={() => setCorrectionDialogOpen(false)}
        onSubmit={handleCorrectionSubmit}
      />
    </>
  );
}