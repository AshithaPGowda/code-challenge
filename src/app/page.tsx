'use client';

import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Snackbar
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  PendingActions as PendingIcon,
  Warning as WarningIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import StatsCard from '@/components/StatsCard';
import I9Table from '@/components/I9Table';
import I9DetailModal from '@/components/I9DetailModal';
import { I9Form, I9FormStatus } from '@/lib/types';

export default function Home() {
  const [forms, setForms] = useState<I9Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<I9Form | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Stats calculations
  const totalForms = forms.length;
  const pendingReview = forms.filter(f => f.status === I9FormStatus.COMPLETED).length;
  const needsCorrection = forms.filter(f => f.status === I9FormStatus.NEEDS_CORRECTION).length;
  const verified = forms.filter(f => f.status === I9FormStatus.VERIFIED).length;

  // Fetch all I-9 forms from database
  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from real API endpoint
      const response = await fetch('/api/i9');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform database dates back to Date objects
      const transformedForms = data.map((form: any) => ({
        ...form,
        date_of_birth: new Date(form.date_of_birth),
        created_at: new Date(form.created_at),
        updated_at: new Date(form.updated_at),
        completed_at: form.completed_at ? new Date(form.completed_at) : null,
        employer_reviewed_at: form.employer_reviewed_at ? new Date(form.employer_reviewed_at) : null,
        employee_signature_date: form.employee_signature_date ? new Date(form.employee_signature_date) : null
      }));
      
      setForms(transformedForms);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load I-9 forms. Please try again.');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Action handlers
  const handleView = (form: I9Form) => {
    setSelectedForm(form);
  };

  const handleApprove = async (form: I9Form) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/i9/${form.id}?action=approve-data`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewed_by: 'hr@company.com' // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve form');
      }

      // Refresh data
      await fetchForms();
      setSnackbar({
        open: true,
        message: `Form approved for ${form.first_name} ${form.last_name}`,
        severity: 'success'
      });
      setSelectedForm(null); // Close modal
    } catch (err) {
      console.error('Error approving form:', err);
      setSnackbar({
        open: true,
        message: 'Failed to approve form. Please try again.',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (form: I9Form, notes: string) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/i9/${form.id}?action=request-corrections`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employer_notes: notes,
          reviewed_by: 'hr@company.com' // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request corrections');
      }

      // Refresh data
      await fetchForms();
      setSnackbar({
        open: true,
        message: `Corrections requested for ${form.first_name} ${form.last_name}`,
        severity: 'success'
      });
      setSelectedForm(null); // Close modal
    } catch (err) {
      console.error('Error requesting corrections:', err);
      setSnackbar({
        open: true,
        message: 'Failed to request corrections. Please try again.',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Wrapper for I9Table onReject - opens correction dialog through modal
  const handleTableReject = (form: I9Form) => {
    setSelectedForm(form);
  };

  const handleVerify = async (form: I9Form) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/i9/${form.id}?action=verify-final`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewed_by: 'hr@company.com' // TODO: Get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify form');
      }

      // Refresh data
      await fetchForms();
      setSnackbar({
        open: true,
        message: `Form verified for ${form.first_name} ${form.last_name}`,
        severity: 'success'
      });
      setSelectedForm(null); // Close modal
    } catch (err) {
      console.error('Error verifying form:', err);
      setSnackbar({
        open: true,
        message: 'Failed to verify form. Please try again.',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (form: I9Form) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      
      // Open PDF in new tab
      const pdfUrl = `/api/i9/${form.id}/pdf`;
      window.open(pdfUrl, '_blank');
      
      setSnackbar({
        open: true,
        message: `PDF opened for ${form.first_name} ${form.last_name}`,
        severity: 'success'
      });
      setSelectedForm(null); // Close modal
    } catch (err) {
      console.error('Error opening PDF:', err);
      setSnackbar({
        open: true,
        message: 'Failed to open PDF. Please try again.',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default', pt: 2 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            I-9 Employer Dashboard
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8 }}>
            Telnyx Voice Assistant
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            mb: 4,
            '& > *': {
              flex: '1 1 250px',
              minWidth: '250px'
            }
          }}
        >
          <StatsCard
            title="Total Forms"
            value={totalForms}
            icon={<AssignmentIcon />}
            color="#0C2B4E"
          />
          <StatsCard
            title="Pending Review"
            value={pendingReview}
            icon={<PendingIcon />}
            color="#450693"
          />
          <StatsCard
            title="Needs Correction"
            value={needsCorrection}
            icon={<WarningIcon />}
            color="#eb0909ff"
          />
          <StatsCard
            title="Verified"
            value={verified}
            icon={<VerifiedIcon />}
            color="#7BC67A"
          />
        </Box>

        {/* I-9 Forms Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            I-9 Forms
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Review and manage employee I-9 forms submitted via voice calls
          </Typography>
        </Paper>

        {/* I-9 Forms Table */}
        <Paper elevation={3} sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <I9Table
              forms={forms}
              loading={loading}
              onView={handleView}
              onApprove={handleApprove}
              onReject={handleTableReject}
              onVerify={handleVerify}
              onDownloadPdf={handleDownloadPdf}
            />
          )}
        </Paper>

        {/* I-9 Detail Modal */}
        <I9DetailModal
          open={!!selectedForm}
          form={selectedForm}
          onClose={() => setSelectedForm(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onVerify={handleVerify}
          onDownloadPdf={handleDownloadPdf}
          loading={actionLoading}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}