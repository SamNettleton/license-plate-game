import { useNavigate } from 'react-router-dom';

import { Button } from '@components';

function Home() {
  const navigate = useNavigate();

  const practicePage = () => {
    navigate('/practice');
  };

  return (
    <div className="App">
      <header className="App-header">
        <Button variant="contained">Daily Game</Button>
        <Button variant="contained" onClick={practicePage}>
          Practice
        </Button>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Home;
