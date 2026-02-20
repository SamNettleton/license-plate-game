import { Box } from '@components';

type Props = {
  solutions: string[];
};

export default function ResultDisplay({ solutions }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <Box sx={solutionsContainerStyles}>
        <Box sx={{ paddingBottom: '0.75rem' }}>
          You have found {solutions.length} {solutions.length == 1 ? 'word' : 'words'}
        </Box>
        {solutions.map((solution: string) => (
          <Box sx={solutionStyles}>{solution}</Box>
        ))}
      </Box>
    </Box>
  );
}

const solutionsContainerStyles = {
  width: '90%',
  mx: 'auto',
  p: 2,
  fontSize: '1rem',
  borderRadius: 2,
  border: '2px solid',
  borderColor: 'divider',
  color: 'theme.vars.palette.primary',
  padding: '1rem 1.5rem 1rem 1rem',
};

const solutionStyles = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  minWidth: '140px',
  width: 'fit-content',
};
