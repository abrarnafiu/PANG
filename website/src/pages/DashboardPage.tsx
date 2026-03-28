import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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

interface Quote {
  ticker: string;
  current_price: number;
  previous_close: number;
  market_cap: number | null;
  pe_ratio: number | null;
  change_1d_pct: number | null;
  change_5d_pct: number | null;
}

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const DashboardPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const searchTickers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await api.get("/api/stocks/search", { params: { q: q.trim() } });
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const loadQuote = useCallback(async (ticker: string) => {
    setLoadingQuote(true);
    setError("");
    try {
      const { data } = await api.get(`/api/stocks/quote/${encodeURIComponent(ticker)}`);
      setQuote(data);
      setSelectedTicker(ticker);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to load quote.";
      setError(msg);
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  const loadHistory = useCallback(async (ticker: string) => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/api/stocks/history/${encodeURIComponent(ticker)}`, {
        params: { period: "1mo" },
      });
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSelectTicker = (ticker: string) => {
    setQuery(ticker);
    setSuggestions([]);
    loadQuote(ticker);
    loadHistory(ticker);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim().toUpperCase();
    if (t) {
      handleSelectTicker(t);
    }
  };

  const chartData = {
    labels: history.map((d) => d.date),
    datasets: [
      {
        label: "Close",
        data: history.map((d) => d.close),
        borderColor: theme.accent,
        backgroundColor: "rgba(0, 212, 255, 0.1)",
        fill: true,
        tension: 0.2,
      },
    ],
  };

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

  return (
    <Page>
      <Header>
        <Logo onClick={() => navigate("/dashboard")}>PANG</Logo>
        <Nav>
          <span style={{ color: theme.textMuted, marginRight: "1rem" }}>{user?.username ?? user?.email}</span>
          <LogoutBtn onClick={logout}>Logout</LogoutBtn>
        </Nav>
      </Header>

      <Main>
        <SearchForm onSubmit={handleSubmit}>
          <SearchInput
            type="text"
            placeholder="Search ticker or company…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              searchTickers(e.target.value);
            }}
            onFocus={() => query.trim() && searchTickers(query)}
          />
          <SearchBtn type="submit">Search</SearchBtn>
          {suggestions.length > 0 && (
            <Suggestions>
              {suggestions.map((s) => (
                <SuggestionItem key={s.symbol} onClick={() => handleSelectTicker(s.symbol)}>
                  <strong>{s.symbol}</strong> {s.name}
                </SuggestionItem>
              ))}
            </Suggestions>
          )}
        </SearchForm>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {loadingQuote && <P>Loading quote…</P>}
        {quote && !loadingQuote && (
          <CardGrid>
            <Card>
              <CardLabel>Price</CardLabel>
              <CardValue>${quote.current_price.toFixed(2)}</CardValue>
            </Card>
            <Card>
              <CardLabel>1d change</CardLabel>
              <CardValue positive={quote.change_1d_pct != null && quote.change_1d_pct >= 0} negative={quote.change_1d_pct != null && quote.change_1d_pct < 0}>
                {quote.change_1d_pct != null ? `${quote.change_1d_pct >= 0 ? "+" : ""}${quote.change_1d_pct.toFixed(2)}%` : "—"}
              </CardValue>
            </Card>
            <Card>
              <CardLabel>5d change</CardLabel>
              <CardValue positive={quote.change_5d_pct != null && quote.change_5d_pct >= 0} negative={quote.change_5d_pct != null && quote.change_5d_pct < 0}>
                {quote.change_5d_pct != null ? `${quote.change_5d_pct >= 0 ? "+" : ""}${quote.change_5d_pct.toFixed(2)}%` : "—"}
              </CardValue>
            </Card>
            <Card>
              <CardLabel>Market cap</CardLabel>
              <CardValue>
                {quote.market_cap != null ? `$${(quote.market_cap / 1e9).toFixed(2)}B` : "—"}
              </CardValue>
            </Card>
            <Card>
              <CardLabel>P/E ratio</CardLabel>
              <CardValue>{quote.pe_ratio != null ? quote.pe_ratio.toFixed(2) : "—"}</CardValue>
            </Card>
          </CardGrid>
        )}

        {selectedTicker && (
          <ChartSection>
            <ChartTitle>{selectedTicker} – 1 month</ChartTitle>
            {loadingHistory ? (
              <P>Loading chart…</P>
            ) : history.length > 0 ? (
              <ChartWrap>
                <Line data={chartData} options={chartOptions} />
              </ChartWrap>
            ) : null}
            {selectedTicker && (
              <ActionLinks>
                <AnalysisLink to={`/analysis/${selectedTicker}`}>View analysis</AnalysisLink>
                <MonteCarloLink to={`/montecarlo/${selectedTicker}`}>Monte Carlo simulation →</MonteCarloLink>
              </ActionLinks>
            )}
          </ChartSection>
        )}
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

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.accent};
  cursor: pointer;
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
  max-width: 1200px;
  margin: 0 auto;
`;

const SearchForm = styled.form`
  position: relative;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 8px;
  color: ${theme.text};
  font-size: 1rem;
  &::placeholder {
    color: ${theme.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${theme.accent};
  }
`;

const SearchBtn = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${theme.accent};
  color: ${theme.bg};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    filter: brightness(1.1);
  }
`;

const Suggestions = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 10;
`;

const SuggestionItem = styled.li`
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: ${theme.text};
  &:hover {
    background: rgba(0, 212, 255, 0.1);
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

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 12px;
  padding: 1.25rem;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${theme.accent};
  }
`;

const CardLabel = styled.div`
  font-size: 0.85rem;
  color: ${theme.textMuted};
  margin-bottom: 0.25rem;
`;

const CardValue = styled.div<{ positive?: boolean; negative?: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  ${(p) => p.positive && `color: ${theme.success};`}
  ${(p) => p.negative && `color: ${theme.error};`}
`;

const ChartSection = styled.section`
  margin-top: 2rem;
`;

const ChartTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: ${theme.text};
`;

const ChartWrap = styled.div`
  height: 320px;
  margin-bottom: 1rem;
`;

const ActionLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
`;

const AnalysisLink = styled(Link)`
  display: inline-block;
  color: ${theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const MonteCarloLink = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1.1rem;
  background: ${theme.accent};
  color: ${theme.bg};
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
  transition: filter 0.15s;
  &:hover {
    filter: brightness(1.12);
  }
`;

export default DashboardPage;
