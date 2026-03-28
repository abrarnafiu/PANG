import numpy as np
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor
from flask import Blueprint, request, jsonify

from supabase_auth import require_supabase_auth

montecarlo_bp = Blueprint("montecarlo", __name__)

MAX_SIMULATIONS = 10_000
MAX_DAYS = 365
N_WORKERS = 4


def _simulate_chunk(S0: float, mu: float, sigma: float, T: int, n_sims: int, seed: int) -> np.ndarray:
    """
    Run a vectorized batch of Geometric Brownian Motion simulations.
    Returns an array of shape (T, n_sims) representing price paths.

    GBM: S_t = S_0 * exp(sum of log-normal increments)
    Log increments ~ N((mu - sigma^2/2) * dt, sigma * sqrt(dt))
    """
    rng = np.random.default_rng(seed)
    drift = (mu - 0.5 * sigma ** 2)          # daily drift
    diffusion = sigma                          # daily diffusion
    increments = rng.normal(drift, diffusion, size=(T, n_sims))
    log_paths = np.cumsum(increments, axis=0)
    return S0 * np.exp(log_paths)


@montecarlo_bp.route("/<ticker>", methods=["GET"])
@require_supabase_auth
def montecarlo(ticker: str):
    ticker = (ticker or "").strip().upper()
    if not ticker:
        return jsonify({"error": "Ticker is required."}), 400

    try:
        n_sims = int(request.args.get("simulations", 1000))
        T = int(request.args.get("days", 252))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid parameters."}), 400

    n_sims = max(1, min(n_sims, MAX_SIMULATIONS))
    T = max(1, min(T, MAX_DAYS))

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1y")
        if hist.empty or len(hist) < 30:
            return jsonify({"error": f"Insufficient historical data for '{ticker}'."}), 404

        closes = hist["Close"].values.astype(float)
        log_returns = np.diff(np.log(closes))
        mu = float(np.mean(log_returns))           # estimated daily mean log-return
        sigma = float(np.std(log_returns, ddof=1)) # estimated daily volatility
        S0 = float(closes[-1])                     # starting price

        # Split simulations across N_WORKERS threads for parallel computation.
        # NumPy releases the GIL during C-extension calls, so threads run concurrently.
        base = n_sims // N_WORKERS
        chunk_sizes = [base] * N_WORKERS
        chunk_sizes[-1] += n_sims % N_WORKERS

        args = [
            (S0, mu, sigma, T, chunk_sizes[i], i * 1000)
            for i in range(N_WORKERS)
        ]

        with ThreadPoolExecutor(max_workers=N_WORKERS) as executor:
            chunks = list(executor.map(lambda a: _simulate_chunk(*a), args))

        # Combine chunks into full path matrix: shape (T, n_sims)
        all_paths = np.concatenate(chunks, axis=1)

        # Compute percentile paths along the time axis for visualization
        pct_levels = [5, 25, 50, 75, 95]
        percentile_paths = {
            str(p): [round(v, 4) for v in np.percentile(all_paths, p, axis=1).tolist()]
            for p in pct_levels
        }

        # Final price distribution for risk metrics.
        # p5/p50/p95 are extracted from the already-computed percentile_paths rather
        # than recomputing np.percentile on final_prices three more times.
        final_prices = all_paths[-1]
        p5_final  = percentile_paths["5"][-1]
        p50_final = percentile_paths["50"][-1]
        p95_final = percentile_paths["95"][-1]
        mean_final = float(np.mean(final_prices))

        # Value at Risk (95%): maximum expected loss at 95% confidence over the period
        var_95 = float(S0 - p5_final)
        var_95_pct = float((var_95 / S0) * 100)

        # Probability the price is higher at end of period than today
        prob_profit = float(np.mean(final_prices > S0) * 100)

        expected_return_pct = float(((mean_final - S0) / S0) * 100)

        # Annualised metrics (252 trading days/year)
        ann_volatility_pct = float(sigma * np.sqrt(252) * 100)
        ann_return_pct = float(mu * 252 * 100)

        # Day labels (thinned for large T to keep response compact)
        if T <= 60:
            date_labels = [f"Day {i + 1}" for i in range(T)]
        else:
            step = T // 60
            date_labels = [f"Day {i + 1}" if i % step == 0 or i == T - 1 else "" for i in range(T)]

        return jsonify({
            "ticker": ticker,
            "current_price": round(S0, 4),
            "simulations": n_sims,
            "days": T,
            "n_workers": N_WORKERS,
            "percentile_paths": percentile_paths,
            "date_labels": date_labels,
            "metrics": {
                "var_95": round(var_95, 4),
                "var_95_pct": round(var_95_pct, 4),
                "expected_return_pct": round(expected_return_pct, 4),
                "mean_final_price": round(mean_final, 4),
                "p5_final": round(p5_final, 4),
                "p50_final": round(p50_final, 4),
                "p95_final": round(p95_final, 4),
                "prob_profit_pct": round(prob_profit, 4),
                "ann_volatility_pct": round(ann_volatility_pct, 4),
                "ann_return_pct": round(ann_return_pct, 4),
            },
        }), 200

    except Exception as e:
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500
