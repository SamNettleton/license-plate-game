import { Box, Typography } from '@components';

type Props = {
  solutions: string[];
};

export default function ResultDisplay({ solutions }: Props) {
  const columnCount = solutions.length > 10 ? 'repeat(2, 1fr)' : '1fr';

  return (
    <Box sx={outerContainerStyles}>
      <Box sx={solutionsContainerStyles}>
        <Typography
          variant="subtitle2"
          sx={{
            pb: 1.5,
            fontWeight: 'bold',
            borderBottom: '2px solid',
            borderColor: 'divider',
            mb: 1,
            textAlign: 'center',
          }}
        >
          You have found {solutions.length} {solutions.length === 1 ? 'word' : 'words'}
        </Typography>

        <Box sx={solutionsBoxStyles(columnCount)}>
          {solutions.map((solution, index) => (
            <Box key={index} sx={solutionStyles}>
              {solution.charAt(0).toUpperCase() + solution.slice(1).toLowerCase()}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

const outerContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
};

const solutionsContainerStyles = {
  width: '90%',
  mx: 'auto',
  p: 2,
  borderRadius: 2,
  border: '2px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  boxShadow: 1,
};

const solutionsBoxStyles = (columnCount: string) => ({
  display: 'grid',
  gridTemplateColumns: columnCount,
  gap: 1.5,
  overflowY: 'auto',
  // Adjust this value so it fits your desktop layout height
  maxHeight: 'calc(100vh - 300px)',
  pr: 1, // Room for scrollbar
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'divider',
    borderRadius: '10px',
  },
});

const solutionStyles = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  minWidth: '140px',
  width: 'fit-content',
  fontSize: '1rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
