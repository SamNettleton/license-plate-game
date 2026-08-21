import { Box, Typography } from '@/material-ui';
import { DailyStatMetrics } from '@/api/statsService';

interface StatsComparisonProps {
  stats: {
    userStats: DailyStatMetrics | null;
    globalStats: DailyStatMetrics;
  };
}

export default function StatsComparison({ stats }: StatsComparisonProps) {
  const { userStats: user, globalStats: global } = stats;

  const renderStatValue = (val: string | number, valueStyles: object) => {
    if (val === '-' || val === null || val === undefined) {
      return (
        <Typography sx={{ ...valueStyles, color: 'text.secondary', fontWeight: 400 }}>-</Typography>
      );
    }

    return <Typography sx={valueStyles}>{val}</Typography>;
  };

  const rows = [
    {
      label: 'Words Found',
      you: user ? user.wordsFoundCount : '-',
      avg: global.wordsFoundCount,
    },
    {
      label: 'Points',
      you: user ? user.totalPoints : '-',
      avg: global.totalPoints,
    },
    {
      label: 'Avg. Length',
      you: user ? user.avgWordLength : '-',
      avg: global.avgWordLength,
    },
    {
      label: 'Shortest',
      you: user && user.minWordLength > 0 ? user.minWordLength : '-',
      avg: global.minWordLength > 0 ? global.minWordLength : '-',
    },
    {
      label: 'Longest',
      you: user && user.maxWordLength > 0 ? user.maxWordLength : '-',
      avg: global.maxWordLength > 0 ? global.maxWordLength : '-',
    },
  ];

  return (
    <Box sx={containerStyles}>
      {/* Table-wide Header Row */}
      <Box sx={headerRowStyles}>
        <Box sx={labelColumnStyles}></Box>
        <Box sx={valueGroupStyles}>
          <Box sx={userColumnHeaderStyles}>
            <Typography sx={columnHeaderStyles}>YOU</Typography>
          </Box>
          <Box sx={avgColumnHeaderStyles}>
            <Typography sx={columnHeaderStyles}>GLOBAL</Typography>
          </Box>
        </Box>
      </Box>

      {/* Row List */}
      <Box sx={rowListStyles}>
        {rows.map((row) => (
          <Box key={row.label} sx={dataRowStyles}>
            {/* Category Label */}
            <Box sx={labelColumnStyles}>
              <Typography sx={categoryLabelStyles}>{row.label}</Typography>
            </Box>

            {/* Stat Values */}
            <Box sx={valueGroupStyles}>
              <Box sx={userValueColumnStyles}>{renderStatValue(row.you, userValueStyles)}</Box>
              <Box sx={avgValueColumnStyles}>{renderStatValue(row.avg, globalValueStyles)}</Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const containerStyles = {
  width: '100%',
  maxWidth: 360,
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const headerRowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pb: 1,
  mb: 1,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const rowListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const dataRowStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  py: 0.5,
};

const labelColumnStyles = {
  flex: 1,
  pr: 2,
};

const valueGroupStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 2.5, sm: 4 },
};

const userColumnHeaderStyles = {
  textAlign: 'right',
  minWidth: 56,
};

const avgColumnHeaderStyles = {
  textAlign: 'right',
  minWidth: 64,
};

const userValueColumnStyles = {
  textAlign: 'right',
  minWidth: 56,
};

const avgValueColumnStyles = {
  textAlign: 'right',
  minWidth: 64,
};

const categoryLabelStyles = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'text.primary',
  lineHeight: 1.2,
};

const columnHeaderStyles = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'text.secondary',
};

const userValueStyles = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'primary.main',
  lineHeight: 1,
};

const globalValueStyles = {
  fontSize: '1.25rem',
  fontWeight: 500,
  color: 'text.secondary',
  lineHeight: 1,
};
