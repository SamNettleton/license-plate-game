import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Divider,
  Button,
} from '@components';
import { SuccessIcon, ErrorIcon } from '@icons';

type HowToPlayProps = {
  open: boolean;
  onClose: () => void;
};

export default function HowToPlayModal({ open, onClose }: HowToPlayProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { borderRadius: 3, padding: 1 },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>How to Play</DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Find words that contain the three letters shown on the license plate in the{' '}
          <strong>exact same order</strong>.
        </Typography>

        <Box sx={exampleContainerStyles}>
          {/* Example Plate Display */}
          <Typography variant="h5" sx={{ letterSpacing: 4, fontWeight: 'bold', mb: 1 }}>
            L P G
          </Typography>

          {/* Correct Example */}
          <Box sx={exampleBoxStyles}>
            <SuccessIcon color="success" fontSize="small" />
            <Typography variant="body2" color="success.main" sx={{ lineHeight: 1.7 }}>
              <strong>L</strong>ea<strong>p</strong>fro<strong>g</strong>, <strong>L</strong>im
              <strong>p</strong>in<strong>g</strong>, or S<strong>l</strong>ee<strong>p</strong>in
              <strong>g</strong>
            </Typography>
          </Box>

          {/* Incorrect Example */}
          <Box sx={exampleBoxStyles}>
            <ErrorIcon color="error" fontSize="small" />
            <Typography variant="body2" color="error.main" sx={{ lineHeight: 1.7 }}>
              Goalpost ('G' is before 'L' and 'P')
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Scoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Longer words earn more points. Reach the goal to win the daily challenge!
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth sx={{ maxWidth: '200px' }}>
          Got it!
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const exampleContainerStyles = {
  my: 3,
  p: 2,
  bgcolor: 'action.hover',
  borderRadius: 2,
  textAlign: 'center',
  border: '1px dashed',
  borderColor: 'divider',
};

const exampleBoxStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 1,
  mb: 1,
};
