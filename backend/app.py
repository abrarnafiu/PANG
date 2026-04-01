import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, Response

from routes.stocks import stocks_bp
from routes.montecarlo import montecarlo_bp

app = Flask(__name__)

_ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
}

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    if origin in _ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return Response(status=200)

app.register_blueprint(stocks_bp, url_prefix="/api/stocks")
app.register_blueprint(montecarlo_bp, url_prefix="/api/montecarlo")

if __name__ == "__main__":
    import os
    secret = os.environ.get("SUPABASE_JWT_SECRET", "")
    if secret:
        print(f"✓ SUPABASE_JWT_SECRET loaded ({len(secret)} chars)")
    else:
        print("✗ SUPABASE_JWT_SECRET NOT SET — all API calls will return 401")
    app.run(debug=True, port=5000)
