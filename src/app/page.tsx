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
  Paper
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

  // Stats calculations
  const totalForms = forms.length;
  const pendingReview = forms.filter(f => f.status === I9FormStatus.COMPLETED).length;
  const needsCorrection = forms.filter(f => f.status === I9FormStatus.NEEDS_CORRECTION).length;
  const verified = forms.filter(f => f.status === I9FormStatus.VERIFIED).length;

  // Fetch all I-9 forms
  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For demo purposes, we'll show an empty state since we don't have a "get all forms" endpoint yet
      // In a real implementation, you'd create a new endpoint like /api/i9/all
      // For now, let's create some mock data to show the dashboard functionality
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockForms: I9Form[] = [
        {
          id: '1',
          employee_id: 'emp-1',
          first_name: 'John',
          last_name: 'Doe',
          middle_initial: 'M',
          other_last_names: '',
          address: '123 Main St',
          apt_number: '4B',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
          date_of_birth: new Date('1990-01-15'),
          ssn: '123-45-6789',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          citizenship_status: 'us_citizen' as any,
          status: 'completed' as any,
          completed_at: new Date('2025-11-03T10:30:00Z'),
          created_at: new Date('2025-11-03T09:15:00Z'),
          updated_at: new Date('2025-11-03T10:30:00Z')
        },
        {
          id: '2',
          employee_id: 'emp-2',
          first_name: 'Jane',
          last_name: 'Smith',
          middle_initial: undefined,
          other_last_names: '',
          address: '456 Oak Ave',
          apt_number: undefined,
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90210',
          date_of_birth: new Date('1985-05-20'),
          ssn: undefined,
          email: 'jane.smith@example.com',
          phone: '+1-555-0456',
          citizenship_status: 'lawful_permanent_resident' as any,
          status: 'data_approved' as any,
          completed_at: new Date('2025-11-02T14:20:00Z'),
          created_at: new Date('2025-11-02T13:45:00Z'),
          updated_at: new Date('2025-11-02T15:10:00Z')
        },
        {
          id: '3',
          employee_id: 'emp-3',
          first_name: 'Carlos',
          last_name: 'Rodriguez',
          middle_initial: 'A',
          other_last_names: '',
          address: '789 Pine Rd',
          apt_number: '12A',
          city: 'Miami',
          state: 'FL',
          zip_code: '33101',
          date_of_birth: new Date('1992-08-10'),
          ssn: undefined,
          email: 'carlos.rodriguez@example.com',
          phone: '+1-555-0789',
          citizenship_status: 'authorized_alien' as any,
          status: 'needs_correction' as any,
          employer_notes: 'Please verify address details',
          completed_at: new Date('2025-11-01T16:45:00Z'),
          created_at: new Date('2025-11-01T16:20:00Z'),
          updated_at: new Date('2025-11-01T17:30:00Z')
        }
      ];
      
      setForms(mockForms);
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
    try {
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
      alert(`Form approved for ${form.first_name} ${form.last_name}`);
    } catch (err) {
      console.error('Error approving form:', err);
      alert('Failed to approve form. Please try again.');
    }
  };

  const handleReject = async (form: I9Form, notes: string) => {
    try {
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
      alert(`Corrections requested for ${form.first_name} ${form.last_name}`);
    } catch (err) {
      console.error('Error requesting corrections:', err);
      alert('Failed to request corrections. Please try again.');
    }
  };

  // Wrapper for I9Table onReject - opens correction dialog through modal
  const handleTableReject = (form: I9Form) => {
    setSelectedForm(form);
  };

  const handleVerify = async (form: I9Form) => {
    try {
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
      alert(`Form verified for ${form.first_name} ${form.last_name}`);
    } catch (err) {
      console.error('Error verifying form:', err);
      alert('Failed to verify form. Please try again.');
    }
  };

  const handleDownloadPdf = async (form: I9Form) => {
    try {
      const response = await fetch(`/api/i9/${form.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const data = await response.json();
      console.log('PDF data:', data);
      
      // TODO: Implement actual PDF download when pdf-lib is integrated
      alert(`PDF generated for ${form.first_name} ${form.last_name}. Check console for data.`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
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
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
        <Paper elevation={3} sx={{ p: 1, mb: 1 }}>
          <Typography variant="h6" gutterBottom>
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
        />
      </Container>
    </Box>
  );
}