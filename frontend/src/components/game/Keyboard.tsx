import { Box, Button } from '@components';
import { DeleteIcon } from '@icons';

type KeyboardProps = {
  disabled?: boolean;
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
};

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
];

export default function Keyboard({ disabled, onChar, onDelete, onEnter }: KeyboardProps) {
  const handleClick = (key: string) => {
    if (disabled) return;
    if (key === 'ENTER') onEnter();
    else if (key === 'DELETE') onDelete();
    else onChar(key);
  };

  return (
    <Box sx={keyboardContainerStyles}>
      {ROWS.map((row, rowIndex) => (
        <Box key={rowIndex} sx={keyRowStyles(rowIndex)}>
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'DELETE';
            return (
              <Button
                key={key}
                variant="contained"
                onClick={() => handleClick(key)}
                aria-label={key === 'DELETE' ? 'delete' : undefined}
                data-testid={key === 'DELETE' ? 'keyboard-delete' : undefined}
                sx={keyStyles(isSpecial)}
              >
                {key === 'DELETE' ? <DeleteIcon fontSize="small" /> : key}
              </Button>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

const keyboardContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  alignItems: 'center',
  width: '100%',
  mt: 3,

  // Short Screen Optimization
  '@media (max-height: 600px)': {
    mt: 0,
    gap: 0.75,
  },
};

const keyRowStyles = (rowIndex: number) => ({
  display: 'flex',
  gap: { xs: 0.75, sm: 1 },
  width: '100%',
  justifyContent: 'center',
  px: rowIndex === 1 ? { xs: '5%', sm: '5%' } : 0,
});

const keyStyles = (isSpecial: boolean) => ({
  flex: isSpecial ? 1.5 : 1,
  minWidth: 0,
  height: { xs: '45px', sm: '58px' },

  // Short Screen Optimization
  '@media (max-height: 600px)': {
    height: '38px',
    fontSize: isSpecial ? '0.5rem' : '1rem',
    borderRadius: '3px !important',
  },

  '@media (max-width: 600px) and (min-height: 700px)': {
    height: '58px',
    fontSize: isSpecial ? '0.8rem' : '1.25rem',
  },

  p: 0,
  borderRadius: '4px !important',
  fontSize: isSpecial ? '0.7rem' : '1.1rem',
  fontWeight: 'bold',
  bgcolor: 'action.selected',
  color: 'text.primary',
  textTransform: 'none',
  '&:hover': { bgcolor: 'action.hover' },
  '@media (hover: none)': {
    '&:hover': { bgcolor: 'action.selected' },
  },
});
