'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useState } from 'react';

interface CorrectionNotesDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}

export default function CorrectionNotesDialog({
  open,
  onClose,
  onSubmit
}: CorrectionNotesDialogProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (notes.trim()) {
      onSubmit(notes.trim());
      setNotes('');
    }
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey && notes.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '300px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Request Corrections
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Please provide specific details about what needs to be corrected in the I-9 form. 
          The employee will receive these notes and can resubmit the form with the necessary changes.
        </Typography>

        <TextField
          autoFocus
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          label="Correction Notes"
          placeholder="Please specify what information needs to be corrected..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={handleKeyPress}
          helperText="Tip: Press Ctrl+Enter to submit quickly"
          inputProps={{
            maxLength: 500
          }}
        />

        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mt: 1, display: 'block', textAlign: 'right' }}
        >
          {notes.length}/500 characters
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={!notes.trim()}
        >
          Submit Corrections
        </Button>
      </DialogActions>
    </Dialog>
  );
}