import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalysisData {
  ticker: string;
  sma_5: number | null;
  sma_20: number | null;
  sma_5_series: (number | null)[];
  sma_20_series: (number | null)[];
  dates: string[];
  close_series: number[];
  next_day_prediction: number;
  current_price: number;
  trend: "bullish" | "bearish" | "neutral";
}

interface HistoryRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const AnalysisPage: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!ticker) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      api.get(`/api/stocks/analysis/${encodeURIComponent(ticker)}`),
      api.get(`/api/stocks/history/${encodeURIComponent(ticker)}`, { params: { period: "1mo" } }),
    ])
      .then(([analysisRes, historyRes]) => {
        setAnalysis(analysisRes.data);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Failed to load analysis.";
        setError(msg);
        setAnalysis(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  const chartData = analysis
    ? {
        labels: analysis.dates,
        datasets: [
          {
            label: "Close",
            data: analysis.close_series,
            borderColor: theme.accent,
            backgroundColor: "rgba(0, 212, 255, 0.1)",
            fill: true,
            tension: 0.2,
          },
          {
            label: "SMA 5",
            data: analysis.sma_5_series,
            borderColor: theme.success,
            fill: false,
            tension: 0.2,
          },
          {
            label: "SMA 20",
            data: analysis.sma_20_series,
            borderColor: theme.warning,
            fill: false,
            tension: 0.2,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: theme.text } },
    },
    scales: {
      x: { ticks: { color: theme.textMuted }, grid: { color: theme.border } },
      y: { ticks: { color: theme.textMuted }, grid: { color: theme.border } },
    },
  };

  if (loading) {
    return (
      <Page>
        <Header>
          <Logo to="/dashboard">PANG</Logo>
          <Nav>
            <span style={{ color: theme.textMuted, marginRight: "1rem" }}>{user?.username ?? user?.email}</span>
            <LogoutBtn onClick={logout}>Logout</LogoutBtn>
          </Nav>
        </Header>
        <Main>
          <P>Loading analysis…</P>
        </Main>
      </Page>
    );
  }

  if (error || !ticker) {
    return (
      <Page>
        <Header>
          <Logo to="/dashboard">PANG</Logo>
          <Nav>
            <span style={{ color: theme.textMuted, marginRight: "1rem" }}>{user?.username ?? user?.email}</span>
            <LogoutBtn onClick={logout}>Logout</LogoutBtn>
          </Nav>
        </Header>
        <Main>
          <ErrorMsg>{error || "Invalid ticker."}</ErrorMsg>
          <BackLink to="/dashboard">Back to dashboard</BackLink>
        </Main>
      </Page>
    );
  }

  const trendColor =
    analysis?.trend === "bullish"
      ? theme.success
      : analysis?.trend === "bearish"
        ? theme.error
        : theme.textMuted;

  return (
    <Page>
      <Header>
        <Logo to="/dashboard">PANG</Logo>
        <Nav>
          <span style={{ color: theme.textMuted, marginRight: "1rem" }}>{user?.username ?? user?.email}</span>
          <LogoutBtn onClick={logout}>Logout</LogoutBtn>
        </Nav>
      </Header>

      <Main>
        <PageTitle>
          Analysis: {analysis?.ticker}
          <TrendBadge color={trendColor}>{analysis?.trend}</TrendBadge>
        </PageTitle>

        <SummaryCards>
          <Card>
            <CardLabel>Current price</CardLabel>
            <CardValue>${analysis?.current_price?.toFixed(2)}</CardValue>
          </Card>
          <Card>
            <CardLabel>Next-day prediction</CardLabel>
            <CardValue>${analysis?.next_day_prediction?.toFixed(2)}</CardValue>
          </Card>
          <Card>
            <CardLabel>SMA 5</CardLabel>
            <CardValue>{analysis?.sma_5 != null ? `$${analysis.sma_5.toFixed(2)}` : "—"}</CardValue>
          </Card>
          <Card>
            <CardLabel>SMA 20</CardLabel>
            <CardValue>{analysis?.sma_20 != null ? `$${analysis.sma_20.toFixed(2)}` : "—"}</CardValue>
          </Card>
        </SummaryCards>

        {chartData && (
          <ChartSection>
            <ChartTitle>Price with SMAs</ChartTitle>
            <ChartWrap>
              <Line data={chartData} options={chartOptions} />
            </ChartWrap>
          </ChartSection>
        )}

        {history.length > 0 && (
          <TableSection>
            <TableTitle>Recent OHLCV</TableTitle>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(-20).reverse().map((row, i) => (
                  <tr key={`${row.date}-${i}`}>
                    <td>{row.date}</td>
                    <td>{row.open.toFixed(2)}</td>
                    <td>{row.high.toFixed(2)}</td>
                    <td>{row.low.toFixed(2)}</td>
                    <td>{row.close.toFixed(2)}</td>
                    <td>{row.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableSection>
        )}

        <ActionRow>
          <BackLink to="/dashboard">Back to dashboard</BackLink>
          <MonteCarloLink to={`/montecarlo/${analysis?.ticker ?? ticker}`}>
            Run Monte Carlo simulation →
          </MonteCarloLink>
        </ActionRow>
      </Main>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.bg};
  color: ${theme.text};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid ${theme.border};
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.accent};
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
`;

const LogoutBtn = styled.button`
  background: transparent;
  border: 1px solid ${theme.border};
  color: ${theme.text};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    border-color: ${theme.accent};
    color: ${theme.accent};
  }
`;

const Main = styled.main`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TrendBadge = styled.span<{ color: string }>`
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: ${(p) => p.color}22;
  color: ${(p) => p.color};
  text-transform: capitalize;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 12px;
  padding: 1.25rem;
`;

const CardLabel = styled.div`
  font-size: 0.85rem;
  color: ${theme.textMuted};
  margin-bottom: 0.25rem;
`;

const CardValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
`;

const ChartSection = styled.section`
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: ${theme.text};
`;

const ChartWrap = styled.div`
  height: 360px;
`;

const TableSection = styled.section`
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const TableTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: ${theme.text};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  th,
  td {
    padding: 0.6rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${theme.border};
  }
  th {
    color: ${theme.textMuted};
    font-weight: 600;
  }
  tbody tr:hover {
    background: rgba(0, 212, 255, 0.05);
  }
`;

const ErrorMsg = styled.p`
  color: ${theme.error};
  margin-bottom: 1rem;
`;

const P = styled.p`
  color: ${theme.textMuted};
  margin: 1rem 0;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
`;

const BackLink = styled(Link)`
  color: ${theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const MonteCarloLink = styled(Link)`
  display: inline-block;
  padding: 0.6rem 1.25rem;
  background: ${theme.accent};
  color: ${theme.bg};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: filter 0.15s;
  &:hover {
    filter: brightness(1.12);
  }
`;

export default AnalysisPage;
