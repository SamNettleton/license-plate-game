import * as React from 'react';
import { Box, Accordion, AccordionDetails, AccordionSummary } from '@components';
import { ExpandMoreIcon } from '@icons';

type Props = {
  solutions: string[];
};

export default function MobileResultDisplay({ solutions }: Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleChange = (_: React.SyntheticEvent, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const summaryText = () => {
    if (isExpanded) {
      return `You have found ${solutions.length} ${solutions.length == 1 ? 'word' : 'words'}`;
    } else {
      return `${solutions.join(' ')}`;
    }
  };

  return (
    <Accordion expanded={isExpanded} onChange={handleChange} sx={accordionStyles}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>{summaryText()}</AccordionSummary>
      <AccordionDetails sx={{ maxHeight: '200px', overflowY: 'auto' }}>
        {solutions.map((solution: string) => (
          <Box sx={solutionStyles}>{solution}</Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

const accordionStyles = {
  display: 'block',
  mb: 2,
  width: '95%',
  minWidth: '0',
  mx: 'auto',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  '&:before': { display: 'none' },
  '&.Mui-expanded': { mx: 'auto' },
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const solutionStyles = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  minWidth: '140px',
  width: 'fit-content',
};
