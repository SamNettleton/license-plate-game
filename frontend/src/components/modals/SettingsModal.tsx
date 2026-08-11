import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Divider,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Slide,
} from '@components';
import type { TransitionProps } from '@mui/material/transitions';
import { CloseIcon } from '@icons';
import { useSettings } from '@/context/SettingsContext';
import { syncUser } from '@/api/userService';

type Props = {
  open: boolean;
  maxDisplayNameLength?: number;
  onClose: () => void;
};

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SettingsModal({ open, maxDisplayNameLength = 20, onClose }: Props) {
  const { settings, updateSettings } = useSettings();
  const [displayName, setDisplayName] = React.useState(settings.displayName);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    if (open) {
      setDisplayName(settings.displayName);
    }
  }, [open, settings.displayName]);

  const handleBlur = () => {
    const sanitized = displayName.trim() || 'Anonymous Traveler';
    setDisplayName(sanitized);
    updateSettings({ displayName: sanitized });
  };

  const handleClose = () => {
    handleBlur();
    onClose();
  };

  const handleClear = () => {
    setDisplayName('');
  };

  const isApproachingLimit = displayName.length >= maxDisplayNameLength - 5;
  const hasText = displayName.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="settings-modal-title"
      slots={{
        transition: isMobile ? SlideUp : undefined,
      }}
      slotProps={{
        paper: { sx: isMobile ? mobileDialogStyles : desktopDialogStyles },
        backdrop: { sx: backdropStyles },
      }}
    >
      <DialogTitle id="settings-modal-title" sx={headerStyles}>
        <Typography variant="h6" component="span" fontWeight="bold">
          Settings
        </Typography>
        <IconButton onClick={handleClose} aria-label="close settings" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={dialogContentStyles}>
        <Box sx={formContainerStyles}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Display Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={handleBlur}
              placeholder="Anonymous Traveler"
              variant="outlined"
              slotProps={{
                htmlInput: {
                  maxLength: maxDisplayNameLength,
                },
                input: {
                  endAdornment:
                    isApproachingLimit || hasText ? (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isApproachingLimit && (
                            <Typography variant="caption" color="text.secondary">
                              {displayName.length}/{maxDisplayNameLength}
                            </Typography>
                          )}
                          {hasText && (
                            <IconButton
                              size="small"
                              onClick={handleClear}
                              aria-label="clear display name"
                              edge="end"
                              sx={{ p: 0.25 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </InputAdornment>
                    ) : undefined,
                },
              }}
            />
          </Box>

          <Divider />

          <Box sx={settingRowStyles}>
            <Typography variant="subtitle2" fontWeight="bold">
              Dark Mode
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isDarkTheme}
                  onChange={(e) => updateSettings({ isDarkTheme: e.target.checked })}
                  color="primary"
                  slotProps={{
                    input: {
                      'aria-label': 'Dark Mode',
                    },
                  }}
                />
              }
              label=""
              sx={{ mr: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

const headerStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pb: 1,
  pr: 1,
  pl: 2.5,
};

const dialogContentStyles = {
  px: 2.5,
  pt: 2.5,
  pb: 2.5,
  overflowY: 'auto',
};

const formContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2.5,
};

const settingRowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const backdropStyles = {
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
};

const mobileDialogStyles = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  m: 0,
  width: '100%',
  maxWidth: '100% !important',
  borderRadius: '16px 16px 0 0',
  maxHeight: '85dvh',
  backgroundImage: 'none',
};

const desktopDialogStyles = {
  borderRadius: 3,
  backgroundImage: 'none',
};
