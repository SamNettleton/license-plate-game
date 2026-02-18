import * as React from 'react';
import { Box, TextField } from '@components';
import { checkWordValidity } from '../api/wordService';

type Props = {
  plate: string;
  solutionsCount: Number;
};

function Game(props: Props) {
  const plate = props.plate;
  const solutionsCount = props.solutionsCount;
  console.log(solutionsCount);

  const [guess, setGuess] = React.useState('');

  const checkGuess = async () => {
    //setIsLoading(true);
    try {
      const result = await checkWordValidity(guess, plate);
      if (result.is_valid) {
        //setScore(s => s + 10);
        alert(result.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      //setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <Box
        sx={{
          width: 'fit-content',
          mx: 'auto',
          p: 2,
          fontSize: '4rem',
          borderRadius: 4,
          border: '4px solid',
          borderColor: 'primary.main',
          color: 'theme.vars.palette.primary',
          padding: '1.5rem 4rem 1rem 4rem',
        }}
      >
        {plate}
      </Box>
      <TextField
        hiddenLabel
        placeholder="Enter a solution"
        id="standard-basic"
        variant="standard"
        value={guess}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setGuess(event.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            checkGuess();
          }
        }}
        sx={{}}
      />
    </Box>
  );
}

export default Game;
