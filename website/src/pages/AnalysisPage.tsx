import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import NavigationBar from "../components/Navbar";
import "chart.js/auto";

const Analysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ticker = searchParams.get("ticker") || "";
  const period = searchParams.get("period") || "1mo";

  const [analysisData, setAnalysisData] = useState<{
    Ticker: string;
    Dates: string[];
    "True Values": number[];
    "Predicted Values": number[];
  } | null>(null);

  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/get_analysis?ticker=${ticker}&period=${period}`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setAnalysisData(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchAnalysis();
  }, [ticker, period]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!analysisData) {
    return <div>Loading...</div>;
  }

  // Prepare chart data
  const chartData = {
    labels: analysisData.Dates,
    datasets: [
      {
        label: "True Values",
        data: analysisData["True Values"],
        borderColor: "blue",
        fill: false,
      },
      {
        label: "Predicted Values",
        data: analysisData["Predicted Values"],
        borderColor: "red",
        fill: false,
      },
    ],
  };

  return (
  <div>
      <NavigationBar/>
    <div style={{ padding: "20px" }}>
      <h2>Stock Analysis for {analysisData.Ticker}</h2>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Line data={chartData} />
      </div>
    </div>
    </div>
  );
};

export default Analysis;
