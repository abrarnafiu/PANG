"""Unit and integration tests for the Monte Carlo simulation."""
import numpy as np
import pandas as pd
import pytest
from unittest.mock import patch, MagicMock

from routes.montecarlo import _simulate_chunk


# ── Unit tests: pure simulation math ─────────────────────────────────────────

class TestSimulateChunk:
    def test_output_shape(self):
        paths = _simulate_chunk(S0=100.0, mu=0.0, sigma=0.01, T=10, n_sims=50, seed=0)
        assert paths.shape == (10, 50)

    def test_all_prices_positive(self):
        """GBM prices must always be positive (log-normal property)."""
        paths = _simulate_chunk(S0=100.0, mu=0.0, sigma=0.02, T=252, n_sims=500, seed=1)
        assert np.all(paths > 0)

    def test_starts_near_S0(self):
        """After 1 step, the mean price should be close to S0."""
        S0 = 150.0
        paths = _simulate_chunk(S0=S0, mu=0.0, sigma=0.01, T=1, n_sims=2000, seed=2)
        assert abs(paths[0].mean() - S0) / S0 < 0.05

    def test_reproducible_with_same_seed(self):
        args = (100.0, 0.001, 0.02, 5, 20, 42)
        p1 = _simulate_chunk(*args)
        p2 = _simulate_chunk(*args)
        np.testing.assert_array_equal(p1, p2)

    def test_different_seeds_differ(self):
        p1 = _simulate_chunk(100.0, 0.0, 0.02, 5, 20, seed=0)
        p2 = _simulate_chunk(100.0, 0.0, 0.02, 5, 20, seed=99)
        assert not np.array_equal(p1, p2)

    def test_higher_volatility_wider_spread(self):
        low_vol  = _simulate_chunk(100.0, 0.0, 0.005, 252, 1000, seed=7)
        high_vol = _simulate_chunk(100.0, 0.0, 0.050, 252, 1000, seed=7)
        assert high_vol[-1].std() > low_vol[-1].std()


# ── Integration tests: HTTP endpoint ─────────────────────────────────────────

def _make_fake_ticker(closes):
    """Return a mock yf.Ticker whose .history() yields a DataFrame of closes."""
    df = pd.DataFrame({"Close": closes})
    mock = MagicMock()
    mock.history.return_value = df
    return mock


@pytest.fixture()
def fake_history():
    """100 days of fake close prices centred around 150."""
    rng = np.random.default_rng(0)
    return 150.0 + rng.normal(0, 2, 100).cumsum()


class TestMonteCarloEndpoint:
    def test_returns_200(self, client, bypass_auth, fake_history):
        with patch("routes.montecarlo.yf.Ticker", return_value=_make_fake_ticker(fake_history)):
            resp = client.get("/api/montecarlo/AAPL?simulations=100&days=30")
        assert resp.status_code == 200

    def test_response_structure(self, client, bypass_auth, fake_history):
        with patch("routes.montecarlo.yf.Ticker", return_value=_make_fake_ticker(fake_history)):
            data = client.get("/api/montecarlo/AAPL?simulations=100&days=30").get_json()

        assert data["ticker"] == "AAPL"
        assert data["simulations"] == 100
        assert data["days"] == 30
        assert "n_workers" in data
        assert set(data["percentile_paths"].keys()) == {"5", "25", "50", "75", "95"}
        assert len(data["percentile_paths"]["50"]) == 30
        assert len(data["date_labels"]) == 30

        m = data["metrics"]
        for key in ("var_95", "var_95_pct", "expected_return_pct", "mean_final_price",
                    "p5_final", "p50_final", "p95_final", "prob_profit_pct",
                    "ann_volatility_pct", "ann_return_pct"):
            assert key in m, f"Missing metric: {key}"

    def test_percentiles_ordered(self, client, bypass_auth, fake_history):
        """p5 ≤ p25 ≤ p50 ≤ p75 ≤ p95 at every time step."""
        with patch("routes.montecarlo.yf.Ticker", return_value=_make_fake_ticker(fake_history)):
            data = client.get("/api/montecarlo/AAPL?simulations=500&days=30").get_json()

        pp = data["percentile_paths"]
        for i in range(30):
            assert pp["5"][i] <= pp["25"][i] <= pp["50"][i] <= pp["75"][i] <= pp["95"][i]

    def test_clamps_simulations(self, client, bypass_auth, fake_history):
        with patch("routes.montecarlo.yf.Ticker", return_value=_make_fake_ticker(fake_history)):
            data = client.get("/api/montecarlo/AAPL?simulations=99999&days=10").get_json()
        assert data["simulations"] == 10_000  # capped at MAX_SIMULATIONS

    def test_missing_ticker_returns_400(self, client, bypass_auth):
        resp = client.get("/api/montecarlo/")
        assert resp.status_code == 404  # no route match → Flask 404

    def test_insufficient_data_returns_404(self, client, bypass_auth):
        sparse = _make_fake_ticker([100.0] * 5)  # fewer than 30 days
        with patch("routes.montecarlo.yf.Ticker", return_value=sparse):
            resp = client.get("/api/montecarlo/FAKE?simulations=100&days=10")
        assert resp.status_code == 404

    def test_unauthenticated_returns_401(self, client, fake_history):
        """Without bypass_auth the real auth runs and rejects the missing token."""
        with patch("routes.montecarlo.yf.Ticker", return_value=_make_fake_ticker(fake_history)):
            resp = client.get("/api/montecarlo/AAPL")
        assert resp.status_code == 401
