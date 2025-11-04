'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  IconButton
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
  onDownloadPdf
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
          sx: { minHeight: '70vh' }
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
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="First Name" value={form.first_name} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Last Name" value={form.last_name} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Middle Initial" value={form.middle_initial} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Other Last Names" value={form.other_last_names} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Date of Birth" value={formatDate(form.date_of_birth)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Social Security Number" value={form.ssn ? '***-**-' + form.ssn.slice(-4) : undefined} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Employee ID" value={form.employee_id} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Address Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <InfoField label="Street Address" value={form.address} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="Apartment Number" value={form.apt_number} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="City" value={form.city} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="State" value={form.state} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoField label="ZIP Code" value={form.zip_code} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Email Address" value={form.email} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Phone Number" value={form.phone} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Citizenship Status */}
            <Grid item xs={12}>
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
            </Grid>

            {/* Form Status & Timestamps */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Form Status & Timeline
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Created" value={formatDateTime(form.created_at)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoField label="Last Updated" value={formatDateTime(form.updated_at)} />
                    </Grid>
                    {form.completed_at && (
                      <Grid item xs={12} sm={6}>
                        <InfoField label="Completed" value={formatDateTime(form.completed_at)} />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Employer Notes (if any) */}
            {form.status === I9FormStatus.NEEDS_CORRECTION && form.employer_notes && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Correction Notes:
                  </Typography>
                  <Typography variant="body2">
                    {form.employer_notes}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          {/* Status-based action buttons */}
          {form.status === I9FormStatus.COMPLETED && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => {
                  onApprove(form);
                  onClose();
                }}
              >
                Approve Data
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<EditIcon />}
                onClick={handleRejectClick}
              >
                Request Corrections
              </Button>
            </>
          )}

          {form.status === I9FormStatus.DATA_APPROVED && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<VerifyIcon />}
              onClick={() => {
                onVerify(form);
                onClose();
              }}
            >
              Verify Final
            </Button>
          )}

          {form.status === I9FormStatus.VERIFIED && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => {
                onDownloadPdf(form);
                onClose();
              }}
            >
              Download PDF
            </Button>
          )}

          <Button variant="outlined" onClick={onClose}>
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