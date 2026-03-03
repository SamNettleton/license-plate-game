import { Box, Typography } from '@components';

export default function Logo() {
  return (
    <Box sx={logoContainerStyles}>
      <Typography variant="h6" sx={logoTypographyStyles}>
        LPG
      </Typography>
    </Box>
  );
}

const logoContainerStyles = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  px: 2,
  py: 0.75,
  borderRadius: 1.5,
  overflow: 'hidden',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 0px 1px 0.5px rgba(0, 0, 0, 0.3)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: '3px',
    left: '3px',
    right: '3px',
    bottom: '3px',
    borderRadius: 1,
    pointerEvents: 'none',
    border: '0.5px solid',
    boxShadow: `
      0px 0px 1px 0.5px rgba(0, 0, 0, 0.2),
      -0.5px -0.5px 0.5px rgba(255, 255, 255, 0.2),
      inset 0.5px 0.5px 1px rgba(0, 0, 0, 0.15)
    `,
  },
};

const logoTypographyStyles = {
  fontWeight: 900,
  letterSpacing: 1.5,
  lineHeight: 1,
  color: 'primary.contrastText',
  fontFamily: 'monospace',
  zIndex: 1,
  textShadow: '0px 1px 1px rgba(0, 0, 0, 0.5), 0px -0.5px 0.5px rgba(255, 255, 255, 0.3)',
};
