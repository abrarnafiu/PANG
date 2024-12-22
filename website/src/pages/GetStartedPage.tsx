import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import NavigationBar from '../components/Navbar';

interface StockEntry {
  Date: string;
  Open: number;
  Close: number;
  High: number;
  Low: number;
  Dividends: number;
  StockSplits: number;
  Volume: number;
}

interface StockData {
  Ticker: string;
  Name: string;
  "Current Price": string | number; // Adjusted to handle 'N/A'
  "Market Cap": string | number; // Use the exact name from the API response
  "PE Ratio": string | number; // Use the exact name from the API response
  "52 Week High": number | string; // Include this stat
  "52 Week Low": number | string; // Include this stat
  RecentHistory?: StockEntry[]; // Optional property
  [key: string]: any; // Allow other dynamic keys
}

const GetStartedPage: React.FC = () => {
  const [ticker, setTicker] = useState<string>(''); 
  const [period, setPeriod] = useState<string>('1mo'); 
  const [stockData, setStockData] = useState<StockData | null>(null); 
  const [error, setError] = useState<string>(''); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStockData(null); // Reset stock data before fetching new data

    try {
      const response = await fetch(`http://localhost:5000/api/get_data?ticker=${ticker}&period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data); // Log the data to debug
      setStockData(data); 
    } catch (error) {
      setError((error as Error).message);
      console.error('Error:', error);
    }
  };

  return (
    <Container>
      <NavigationBar />
      <Content>
        <h2>Get Stock Data</h2>
        <form onSubmit={handleSubmit}>
          <StyledLabel>Ticker Symbol:</StyledLabel>
          <StyledInput
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g., AAPL"
            required
          />
          <StyledLabel>Period:</StyledLabel>
          <StyledInput
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g., 1mo"
            required
          />
          <StyledButton type="submit">Submit</StyledButton>
        </form>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {stockData && (
          <div>
            <h3>Stock Data for {stockData.Ticker}:</h3>
            <ul>
              <li><strong>Name:</strong> {stockData.Name}</li>
              <li><strong>Current Price:</strong> {stockData["Current Price"] !== 'N/A' ? stockData["Current Price"] : 'Data not available'}</li>
              <li><strong>Market Cap:</strong> {stockData["Market Cap"] !== 'N/A' ? stockData["Market Cap"] : 'Data not available'}</li>
              <li><strong>PE Ratio:</strong> {stockData["PE Ratio"] !== 'N/A' ? stockData["PE Ratio"] : 'Data not available'}</li>
              <li><strong>52 Week High:</strong> {stockData["52 Week High"] !== 'N/A' ? stockData["52 Week High"] : 'Data not available'}</li>
              <li><strong>52 Week Low:</strong> {stockData["52 Week Low"] !== 'N/A' ? stockData["52 Week Low"] : 'Data not available'}</li>
            </ul>
            <h4>Recent History:</h4>
            {Array.isArray(stockData.RecentHistory) && stockData.RecentHistory.length > 0 ? (
              <ul>
                {stockData.RecentHistory.map((entry, index) => (
                  <li key={index}>
                    <strong>Date:</strong> {entry.Date} | 
                    <strong> Open:</strong> {entry.Open} | 
                    <strong> Close:</strong> {entry.Close} |
                    <strong> High:</strong> {entry.High} | 
                    <strong> Low:</strong> {entry.Low} | 
                    <strong> Volume:</strong> {entry.Volume}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent history available.</p>
            )}
            <Link to={`/analysis?ticker=${ticker}&period=${period}`}>
              <StyledButton type="button">View Analysis</StyledButton>
            </Link>
          </div>
        )}
      </Content>
    </Container>
  );
};

export default GetStartedPage;

// Styled components for layout
const Container = styled.div`
  padding: 20px;
  background-color: #f0f0f0;
  min-height: 100vh;
`;

const Content = styled.div`
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: black;
`;

const StyledLabel = styled.label`
  font-size: 1rem;
  color: #333;
  margin-bottom: 10px;
  display: inline-block;
`;

const StyledInput = styled.input`
  width: 80%;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
`;

const StyledButton = styled.button`
  background-color: #007bff;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
`;

const ErrorMessage = styled.p`
  color: red;
  margin-top: 10px;
`;
