import { Box, Stack, Typography } from '@/material-ui';
import { LeaderboardEntry } from '@/api/leaderboardService';
import { Theme } from '@/material-ui';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
}

export default function LeaderboardTable({ entries, currentUser }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <Box sx={centeredContainerStyles}>
        <Typography variant="body1" color="text.secondary">
          No scores yet for this day.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={leaderboardBodyStyles}>
      <Box sx={entriesListScrollStyles}>
        <Stack spacing={1.5}>
          {entries.map((entry) => (
            <LeaderboardRow key={`${entry.name}-${entry.rank}`} entry={entry} />
          ))}
        </Stack>
      </Box>

      {currentUser && (
        <Box sx={stickyCurrentUserFooterStyles}>
          <LeaderboardRow entry={{ ...currentUser, isCurrentUser: true }} />
        </Box>
      )}
    </Box>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <Box sx={getEntryRowStyles(entry.isCurrentUser)}>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color={entry.isCurrentUser ? 'primary.main' : 'text.secondary'}
      >
        #{entry.rank}
      </Typography>

      <Box>
        <Typography variant="body1" fontWeight={700}>
          {entry.name}
          {entry.isCurrentUser ? ' (you)' : ''}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.wordsFoundCount} words found
        </Typography>
      </Box>

      <Typography variant="subtitle1" fontWeight={700}>
        {entry.score}
      </Typography>
    </Box>
  );
}

const centeredContainerStyles = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 200,
};

const leaderboardBodyStyles = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  position: 'relative',
  overflow: 'hidden',
};

const entriesListScrollStyles = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  pr: 1,
  scrollbarWidth: 'thin',
  scrollbarColor: 'transparent transparent',
  transition: 'scrollbar-color 0.3s ease',

  // Show scrollbar thumb on hover/focus
  '&:hover, &:focus-within': {
    scrollbarColor: (theme: Theme) => `${theme.palette.action.focus} transparent`,
  },

  // WebKit fallback for older browsers
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'transparent',
    borderRadius: '3px',
    transition: 'background-color 0.3s ease',
  },
  '&:hover::-webkit-scrollbar-thumb, &:focus-within::-webkit-scrollbar-thumb': {
    backgroundColor: 'action.focus',
  },
};

const stickyCurrentUserFooterStyles = {
  pt: 1.5,
  mt: 1,
  borderTop: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
};

const getEntryRowStyles = (isCurrentUser?: boolean) => ({
  display: 'grid',
  gridTemplateColumns: '44px 1fr auto',
  alignItems: 'center',
  gap: 2,
  px: 1.5,
  py: 1,
  borderRadius: 2,
  border: '1px solid',
  borderColor: isCurrentUser ? 'primary.main' : 'transparent',
  backgroundColor: isCurrentUser ? 'action.selected' : 'transparent',
});
