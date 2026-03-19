import * as React from 'react';
import { Box, Accordion, AccordionDetails, AccordionSummary, Typography } from '@components';
import { ExpandMoreIcon } from '@icons';

type Props = {
  solutions: string[];
  onToggle: (isOpen: boolean) => void;
};

export default function MobileResultDisplay({ solutions, onToggle }: Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleChange = (_: React.SyntheticEvent, expanded: boolean) => {
    setIsExpanded(expanded);
    onToggle(expanded);
  };

  const summaryText = () => {
    const formattedSolutions = solutions.map(
      (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
    );
    return isExpanded
      ? `You have found ${solutions.length} ${solutions.length === 1 ? 'word' : 'words'}`
      : formattedSolutions.join(' ');
  };

  const columnCount = solutions.length > 10 ? 'repeat(2, 1fr)' : '1fr';

  return (
    <Accordion expanded={isExpanded} onChange={handleChange} sx={accordionStyles(isExpanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={summaryStyles}>
        <Typography noWrap sx={summaryTextStyle}>
          {summaryText()}
        </Typography>
      </AccordionSummary>
      <AccordionDetails role="region" aria-label="Found solutions" sx={detailsStyles(columnCount)}>
        {solutions.map((solution, index) => (
          <Box key={index} sx={solutionStyles}>
            {solution.charAt(0).toUpperCase() + solution.slice(1).toLowerCase()}
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

const accordionStyles = (isExpanded: boolean) => ({
  mb: 2,
  width: '90%',
  mx: 'auto',
  backgroundColor: 'background.paper',
  backgroundImage: 'none',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  zIndex: isExpanded ? 100 : 1,
  transition: 'all 0.3s ease',

  ...(isExpanded && {
    position: 'absolute',
    top: '100%',
    left: '5%',
    width: '90%',
    height: 'calc(100vh - 150px)',
    margin: 0,
  }),
});

const detailsStyles = (columnCount: string) => ({
  display: 'grid',
  gridTemplateColumns: columnCount,
  gap: 1,
  overflowY: 'auto',
  pb: 2,
  maxHeight: 'calc(100vh - 220px)',
  transition: 'grid-template-columns 0.3s ease',

  '@media (max-height: 600px), (max-width: 350px)': {
    fontSize: '0.85rem',
  },
});

const summaryStyles = {
  '& .MuiAccordionSummary-content': {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    minWidth: 0,
  },
};

const summaryTextStyle = {
  fontSize: { xs: '0.9rem', sm: '1rem' },
  // Short Screen Optimization
  '@media (max-height: 600px)': { fontSize: '0.85rem' },
};

const solutionStyles = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  width: '100%',

  minWidth: {
    xs: '120px',
    sm: '140px',
  },

  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',

  '@media (max-height: 600px)': {
    minWidth: '100px',
  },
};
