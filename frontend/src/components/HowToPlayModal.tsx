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

type HowToPlayProps = {
  open: boolean;
  onClose: () => void;
};

export default function HowToPlayModal({ open, onClose }: HowToPlayProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 3, padding: 1 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>How to Play</DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Find words that contain the three letters shown on the license plate in the{' '}
          <strong>exact same order</strong>.
        </Typography>

        <Box
          sx={{
            my: 3,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 2,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" sx={{ letterSpacing: 4, fontWeight: 'bold', mb: 1 }}>
            L P G
          </Typography>
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
            <span style={{ textDecoration: 'underline' }}>L</span>ea
            <span style={{ textDecoration: 'underline' }}>p</span>fro
            <span style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}>
              g
            </span>, <span style={{ textDecoration: 'underline' }}>L</span>im
            <span style={{ textDecoration: 'underline' }}>p</span>in
            <span style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}>g</span>,
            or S<span style={{ textDecoration: 'underline' }}>l</span>ee
            <span style={{ textDecoration: 'underline' }}>p</span>in
            <span style={{ textDecoration: 'underline', textDecorationSkipInk: 'none' }}>g</span>
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            ✖ Goalpost (The 'G' comes before the 'L' and 'P')
          </Typography>
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
