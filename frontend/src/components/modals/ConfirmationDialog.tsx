import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@components';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmationDialog({
  open,
  title,
  content,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="text" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          color="primary"
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
