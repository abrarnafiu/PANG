import numpy as np
import pandas as pd
import yfinance as yf
from flask import Blueprint, request, jsonify
from sklearn.linear_model import LinearRegression

from supabase_auth import require_supabase_auth

stocks_bp = Blueprint("stocks", __name__)

VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}


def _safe_float(val):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


@stocks_bp.route("/quote/<ticker>", methods=["GET"])
@require_supabase_auth
def quote(ticker):
    ticker = (ticker or "").strip().upper()
    if not ticker:
        return jsonify({"error": "Ticker is required."}), 400
    try:
        t = yf.Ticker(ticker)
        info = t.info
        hist = t.history(period="5d")
        if hist.empty:
            return jsonify({"error": f"No data found for ticker '{ticker}'."}), 404
        current = float(hist["Close"].iloc[-1])
        prev_close = _safe_float(info.get("previousClose")) or (float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current)
        hist_1d = t.history(period="5d")
        change_1d = None
        change_5d = None
        if len(hist_1d) >= 2:
            change_1d = ((current - float(hist_1d["Close"].iloc[-2])) / float(hist_1d["Close"].iloc[-2])) * 100
        if len(hist_1d) >= 5:
            change_5d = ((current - float(hist_1d["Close"].iloc[-5])) / float(hist_1d["Close"].iloc[-5])) * 100
        return jsonify({
            "ticker": ticker,
            "current_price": current,
            "previous_close": prev_close,
            "market_cap": info.get("marketCap"),
            "pe_ratio": _safe_float(info.get("trailingPE")),
            "change_1d_pct": round(change_1d, 4) if change_1d is not None else None,
            "change_5d_pct": round(change_5d, 4) if change_5d is not None else None,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch quote: {str(e)}"}), 500


@stocks_bp.route("/history/<ticker>", methods=["GET"])
@require_supabase_auth
def history(ticker):
    ticker = (ticker or "").strip().upper()
    period = (request.args.get("period") or "1mo").strip().lower()
    if period not in VALID_PERIODS:
        period = "1mo"
    if not ticker:
        return jsonify({"error": "Ticker is required."}), 400
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period)
        if hist.empty:
            return jsonify({"error": f"No data found for ticker '{ticker}'."}), 404
        hist = hist.reset_index()
        hist["Date"] = hist["Date"].dt.strftime("%Y-%m-%d")
        ohlcv = hist[["Date", "Open", "High", "Low", "Close", "Volume"]].fillna(0)
        arr = []
        for _, row in ohlcv.iterrows():
            arr.append({
                "date": row["Date"],
                "open": round(float(row["Open"]), 4),
                "high": round(float(row["High"]), 4),
                "low": round(float(row["Low"]), 4),
                "close": round(float(row["Close"]), 4),
                "volume": int(row["Volume"]),
            })
        return jsonify(arr), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500


@stocks_bp.route("/analysis/<ticker>", methods=["GET"])
@require_supabase_auth
def analysis(ticker):
    ticker = (ticker or "").strip().upper()
    if not ticker:
        return jsonify({"error": "Ticker is required."}), 400
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="3mo")
        if hist.empty or len(hist) < 20:
            return jsonify({"error": f"Insufficient data for analysis for ticker '{ticker}'."}), 404
        closes = hist["Close"].values
        sma_5 = pd.Series(closes).rolling(5).mean().values
        sma_20 = pd.Series(closes).rolling(20).mean().values
        last_sma_5 = float(sma_5[-1]) if not np.isnan(sma_5[-1]) else None
        last_sma_20 = float(sma_20[-1]) if not np.isnan(sma_20[-1]) else None
        X = np.arange(len(closes)).reshape(-1, 1)
        y = closes
        model = LinearRegression().fit(X, y)
        next_day_index = len(closes)
        next_day_pred = float(model.predict([[next_day_index]])[0])
        current_price = float(closes[-1])
        if next_day_pred > current_price * 1.002:
            trend = "bullish"
        elif next_day_pred < current_price * 0.998:
            trend = "bearish"
        else:
            trend = "neutral"
        dates = hist.index.strftime("%Y-%m-%d").tolist()
        return jsonify({
            "ticker": ticker,
            "sma_5": last_sma_5,
            "sma_20": last_sma_20,
            "sma_5_series": [round(float(x), 4) if not np.isnan(x) else None for x in sma_5],
            "sma_20_series": [round(float(x), 4) if not np.isnan(x) else None for x in sma_20],
            "dates": dates,
            "close_series": [round(float(x), 4) for x in closes],
            "next_day_prediction": round(next_day_pred, 4),
            "current_price": round(current_price, 4),
            "trend": trend,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to run analysis: {str(e)}"}), 500


@stocks_bp.route("/search", methods=["GET"])
@require_supabase_auth
def search():
    q = (request.args.get("q") or "").strip()
    if not q or len(q) < 1:
        return jsonify([]), 200
    try:
        raw = yf.search(q)
        if raw is None:
            return jsonify([]), 200
        if isinstance(raw, pd.DataFrame) and not raw.empty:
            out = []
            for _, row in raw.head(10).iterrows():
                sym = row.get("symbol") or row.get("symbols")
                if isinstance(sym, str):
                    name = str(row.get("shortName", row.get("longName", sym)))
                    out.append({"symbol": sym, "name": name})
            return jsonify(out), 200
        return jsonify([]), 200
    except Exception:
        return jsonify([]), 200
