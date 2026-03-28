"""Integration tests for the stock data routes."""
import numpy as np
import pandas as pd
import pytest
from unittest.mock import patch, MagicMock


def _mock_ticker(closes, info=None):
    # yfinance returns a timezone-aware DatetimeIndex named "Date"
    idx = pd.date_range("2024-01-01", periods=len(closes), freq="B", tz="UTC", name="Date")
    df = pd.DataFrame(
        {
            "Open":   closes,
            "High":   [c * 1.01 for c in closes],
            "Low":    [c * 0.99 for c in closes],
            "Close":  closes,
            "Volume": [1_000_000] * len(closes),
        },
        index=idx,
    )
    mock = MagicMock()
    mock.history.return_value = df
    mock.info = info or {
        "previousClose": closes[-2] if len(closes) >= 2 else closes[-1],
        "marketCap": 3_000_000_000_000,
        "trailingPE": 28.5,
    }
    return mock


CLOSES_20 = list(150.0 + np.linspace(0, 10, 20))
CLOSES_5  = [148.0, 149.0, 150.0, 151.0, 152.0]


# ── /api/stocks/quote ─────────────────────────────────────────────────────────

class TestQuote:
    def test_returns_200(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            resp = client.get("/api/stocks/quote/AAPL")
        assert resp.status_code == 200

    def test_response_fields(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            data = client.get("/api/stocks/quote/AAPL").get_json()
        for field in ("ticker", "current_price", "previous_close", "change_1d_pct"):
            assert field in data

    def test_ticker_uppercased(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            data = client.get("/api/stocks/quote/aapl").get_json()
        assert data["ticker"] == "AAPL"

    def test_unauthenticated_returns_401(self, client):
        resp = client.get("/api/stocks/quote/AAPL")
        assert resp.status_code == 401


# ── /api/stocks/history ───────────────────────────────────────────────────────

class TestHistory:
    def test_returns_list(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_20)):
            data = client.get("/api/stocks/history/AAPL?period=1mo").get_json()
        assert isinstance(data, list)
        assert len(data) == 20

    def test_ohlcv_keys(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            row = client.get("/api/stocks/history/AAPL").get_json()[0]
        for key in ("date", "open", "high", "low", "close", "volume"):
            assert key in row

    def test_invalid_period_falls_back(self, client, bypass_auth):
        """An invalid period should fall back to 1mo, not 400."""
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            resp = client.get("/api/stocks/history/AAPL?period=99x")
        assert resp.status_code == 200


# ── /api/stocks/analysis ──────────────────────────────────────────────────────

class TestAnalysis:
    def test_returns_200(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_20)):
            resp = client.get("/api/stocks/analysis/AAPL")
        assert resp.status_code == 200

    def test_response_fields(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_20)):
            data = client.get("/api/stocks/analysis/AAPL").get_json()
        for field in ("sma_5", "sma_20", "next_day_prediction", "trend", "current_price"):
            assert field in data

    def test_trend_value(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_20)):
            data = client.get("/api/stocks/analysis/AAPL").get_json()
        assert data["trend"] in ("bullish", "bearish", "neutral")

    def test_insufficient_data_returns_404(self, client, bypass_auth):
        with patch("routes.stocks.yf.Ticker", return_value=_mock_ticker(CLOSES_5)):
            resp = client.get("/api/stocks/analysis/AAPL")
        assert resp.status_code == 404


# ── /api/stocks/search ────────────────────────────────────────────────────────

class TestSearch:
    def test_empty_query_returns_empty_list(self, client, bypass_auth):
        data = client.get("/api/stocks/search?q=").get_json()
        assert data == []

    def test_returns_list_on_results(self, client, bypass_auth):
        mock_df = pd.DataFrame([{"symbol": "AAPL", "shortName": "Apple Inc."}])
        with patch("routes.stocks.yf.search", return_value=mock_df):
            data = client.get("/api/stocks/search?q=apple").get_json()
        assert isinstance(data, list)
        assert data[0]["symbol"] == "AAPL"

    def test_returns_empty_on_yfinance_error(self, client, bypass_auth):
        with patch("routes.stocks.yf.search", side_effect=Exception("network")):
            data = client.get("/api/stocks/search?q=AAPL").get_json()
        assert data == []
