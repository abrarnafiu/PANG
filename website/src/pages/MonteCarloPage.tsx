import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

interface Metrics {
  var_95: number;
  var_95_pct: number;
  expected_return_pct: number;
  mean_final_price: number;
  p5_final: number;
  p50_final: number;
  p95_final: number;
  prob_profit_pct: number;
  ann_volatility_pct: number;
  ann_return_pct: number;
}

interface SimResult {
  ticker: string;
  current_price: number;
  simulations: number;
  days: number;
  n_workers: number;
  percentile_paths: Record<string, number[]>;
  date_labels: string[];
  metrics: Metrics;
}

const SIM_OPTIONS = [500, 1000, 5000, 10000];
const DAY_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "180 days", value: 180 },
  { label: "1 year (252d)", value: 252 },
];

const MonteCarloPage: React.FC = () => {
  const { ticker: urlTicker } = useParams<{ ticker?: string }>();
  const [ticker, setTicker] = useState(urlTicker?.toUpperCase() ?? "");
  const [simulations, setSimulations] = useState(1000);
  const [days, setDays] = useState(252);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const runSimulation = useCallback(
    async (t: string, sims: number, d: number) => {
      const sym = t.trim().toUpperCase();
      if (!sym) {
        setError("Enter a ticker symbol.");
        return;
      }
      setLoading(true);
      setError("");
      setResult(null);
      try {
        const { data } = await api.get(
          `/api/montecarlo/${encodeURIComponent(sym)}`,
          { params: { simulations: sims, days: d } }
        );
        setResult(data);
        if (urlTicker?.toUpperCase() !== sym) {
          navigate(`/montecarlo/${sym}`, { replace: true });
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || "Simulation failed.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [navigate, urlTicker]
  );

  // Auto-run when arriving with a ticker in the URL
  useEffect(() => {
    if (urlTicker) {
      runSimulation(urlTicker, simulations, days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulation(ticker, simulations, days);
  };

  // Build fan chart data from percentile paths
  const chartData = result
    ? {
        labels: result.date_labels,
        datasets: [
          {
            label: "95th % (best case)",
            data: result.percentile_paths["95"],
            borderColor: theme.success,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
          {
            label: "75th %",
            data: result.percentile_paths["75"],
            borderColor: "rgba(72, 187, 120, 0.5)",
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
          {
            label: "Median (50th %)",
            data: result.percentile_paths["50"],
            borderColor: theme.accent,
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
          {
            label: "25th %",
            data: result.percentile_paths["25"],
            borderColor: "rgba(237, 137, 54, 0.5)",
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
          {
            label: "5th % (worst case)",
            data: result.percentile_paths["5"],
            borderColor: theme.error,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.3,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        labels: { color: theme.text, boxWidth: 16, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme.textMuted,
          maxTicksLimit: 10,
          maxRotation: 0,
        },
        grid: { color: theme.border },
      },
      y: {
        ticks: {
          color: theme.textMuted,
          callback: (v: string | number) => `$${Number(v).toFixed(0)}`,
        },
        grid: { color: theme.border },
      },
    },
  };

  const m = result?.metrics;
  const isPositiveReturn = (m?.expected_return_pct ?? 0) >= 0;

  return (
    <Page>
      <Header>
        <Logo to="/dashboard">PANG</Logo>
        <Nav>
          <span style={{ color: theme.textMuted, marginRight: "1rem" }}>
            {user?.username ?? user?.email}
          </span>
          <LogoutBtn onClick={logout}>Logout</LogoutBtn>
        </Nav>
      </Header>

      <Main>
        <PageTitle>Monte Carlo Simulation</PageTitle>
        <Subtitle>
          Geometric Brownian Motion — {simulations.toLocaleString()} paths,{" "}
          {days}-day forecast
        </Subtitle>

        <ControlsForm onSubmit={handleSubmit}>
          <ControlRow>
            <TickerInput
              type="text"
              placeholder="Ticker (e.g. AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
            <Select
              value={simulations}
              onChange={(e) => setSimulations(Number(e.target.value))}
            >
              {SIM_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.toLocaleString()} simulations
                </option>
              ))}
            </Select>
            <Select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
            <RunBtn type="submit" disabled={loading}>
              {loading ? "Running…" : "Run Simulation"}
            </RunBtn>
          </ControlRow>
        </ControlsForm>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {loading && (
          <StatusMsg>
            Running {simulations.toLocaleString()} simulations…
          </StatusMsg>
        )}

        {result && !loading && (
          <>
            <MetricsGrid>
              <MetricCard>
                <MetricLabel>Current Price</MetricLabel>
                <MetricValue>${result.current_price.toFixed(2)}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Median Forecast</MetricLabel>
                <MetricValue>${m!.p50_final.toFixed(2)}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Expected Return</MetricLabel>
                <MetricValue
                  positive={isPositiveReturn}
                  negative={!isPositiveReturn}
                >
                  {m!.expected_return_pct >= 0 ? "+" : ""}
                  {m!.expected_return_pct.toFixed(2)}%
                </MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>VaR 95% (max loss)</MetricLabel>
                <MetricValue negative>
                  −${m!.var_95.toFixed(2)} (−{m!.var_95_pct.toFixed(1)}%)
                </MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Best Case (95th %)</MetricLabel>
                <MetricValue positive>${m!.p95_final.toFixed(2)}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Worst Case (5th %)</MetricLabel>
                <MetricValue negative>${m!.p5_final.toFixed(2)}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Prob. of Profit</MetricLabel>
                <MetricValue positive={m!.prob_profit_pct >= 50}>
                  {m!.prob_profit_pct.toFixed(1)}%
                </MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>Ann. Volatility</MetricLabel>
                <MetricValue>{m!.ann_volatility_pct.toFixed(2)}%</MetricValue>
              </MetricCard>
            </MetricsGrid>

            <ChartSection>
              <ChartTitle>
                {result.ticker} — Price Distribution Fan Chart (
                {result.simulations.toLocaleString()} paths)
              </ChartTitle>
              <ChartWrap>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </ChartWrap>
              <ChartNote>
                Shaded bands show the 5th–95th percentile price range across all
                simulated paths. The bold line is the median (50th percentile).
              </ChartNote>
            </ChartSection>

            <InfoSection>
              <InfoTitle>Methodology</InfoTitle>
              <InfoText>
                Returns are modelled as log-normal using Geometric Brownian
                Motion calibrated on 1 year of historical daily closing prices
                (μ = {m!.ann_return_pct.toFixed(2)}% annualised,{" "}
                σ = {m!.ann_volatility_pct.toFixed(2)}% annualised).
                Simulations are split across {result.n_workers} parallel threads for reduced
                computation time.
              </InfoText>
            </InfoSection>

            <BackLink to={`/analysis/${result.ticker}`}>
              Back to {result.ticker} analysis
            </BackLink>
          </>
        )}

        {!result && !loading && !error && (
          <EmptyState>
            Enter a ticker and click <strong>Run Simulation</strong> to model
            price scenarios.
          </EmptyState>
        )}
      </Main>
    </Page>
  );
};

// ── Styled components ──────────────────────────────────────────────────────────

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
  max-width: 1100px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: ${theme.textMuted};
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
`;

const ControlsForm = styled.form`
  margin-bottom: 1.5rem;
`;

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
`;

const TickerInput = styled.input`
  padding: 0.75rem 1rem;
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 8px;
  color: ${theme.text};
  font-size: 1rem;
  width: 140px;
  text-transform: uppercase;
  &::placeholder {
    color: ${theme.textMuted};
    text-transform: none;
  }
  &:focus {
    outline: none;
    border-color: ${theme.accent};
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 8px;
  color: ${theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${theme.accent};
  }
`;

const RunBtn = styled.button`
  padding: 0.75rem 1.75rem;
  background: ${theme.accent};
  color: ${theme.bg};
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 0.15s;
  &:hover:not(:disabled) {
    filter: brightness(1.12);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.p`
  color: ${theme.error};
  margin-bottom: 1rem;
`;

const StatusMsg = styled.p`
  color: ${theme.textMuted};
  font-size: 0.95rem;
  margin: 1rem 0;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 12px;
  padding: 1.25rem;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${theme.accent};
  }
`;

const MetricLabel = styled.div`
  font-size: 0.82rem;
  color: ${theme.textMuted};
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const MetricValue = styled.div<{ positive?: boolean; negative?: boolean }>`
  font-size: 1.2rem;
  font-weight: 600;
  ${(p) => p.positive && `color: ${theme.success};`}
  ${(p) => p.negative && `color: ${theme.error};`}
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
  height: 420px;
  position: relative;
`;

const ChartNote = styled.p`
  font-size: 0.8rem;
  color: ${theme.textMuted};
  margin-top: 0.75rem;
`;

const InfoSection = styled.div`
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
`;

const InfoTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
`;

const InfoText = styled.p`
  font-size: 0.9rem;
  color: ${theme.textMuted};
  line-height: 1.6;
`;

const EmptyState = styled.div`
  color: ${theme.textMuted};
  font-size: 1rem;
  margin-top: 3rem;
  text-align: center;
`;

const BackLink = styled(Link)`
  color: ${theme.accent};
  text-decoration: none;
  font-size: 0.9rem;
  &:hover {
    text-decoration: underline;
  }
`;

export default MonteCarloPage;
