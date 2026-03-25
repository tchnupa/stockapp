import React from 'react';
import './App.css';
import StockApp from './StockApp';
import { useRef } from 'react';

function App() {
  return (
    <div className="App">
      <StockApp />
	  <br/><br/>
	  <small>
	  Disclaimer: Stock information is provided by <a href="https://finnhub.io">Finnhub</a> and is for informational, non-trading purposes. Stock <br/>
	  prices delayed 15 minutes. This application is for demo purposes only and the author assumes no liability of<br/>
	  any kind. It is the user's responsibility to comply with any Finnhub, stock market, and financial trading policies.
	  </small>
    </div>
  );
}

export default App;
