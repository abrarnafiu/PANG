import yfinance as yf
from flask import Flask, request, jsonify
from flask_cors import CORS
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import yfinance as yf
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import Dense, LSTM, Dropout


app = Flask(__name__)
# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # SQLite database
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # JWT secret key

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Configure CORS to allow requests from your React frontend
CORS(app, 
     origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True)

# Manual CORS handler as backup
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

def is_valid_period(input_period):
    '''Check if the input time period is valid.'''
    period = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']
    return input_period in period

def is_valid_ticker(input_ticker):
    '''Check if the input stock ticker is valid.'''
    ticker = yf.Ticker(input_ticker)
    history = ticker.history(period='1y')
    return not history.empty

def get_current_price(symbol):
    ticker = yf.Ticker(symbol)
    todays_data = ticker.history(period='1d')
    return todays_data['Close'][0]

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

# Initialize database
with app.app_context():
    db.create_all()

# Register Route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify(message="User registered successfully"), 201

# Login Route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity={'username': user.username})
        return jsonify(access_token=access_token), 200
    return jsonify(message="Invalid credentials"), 401

# Protected Route
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(message=f"Hello {current_user['username']}!"), 200

@app.route('/api/get_data', methods=['GET'])
def get_data():
    ticker = request.args.get('ticker')
    period = request.args.get('period')

    # Validate ticker and period
    if not ticker or not period:
        return jsonify({'error': 'Please provide both ticker and period.'}), 400

    if not is_valid_ticker(ticker):
        return jsonify({'error': 'Invalid stock ticker.'}), 400

    if not is_valid_period(period):
        return jsonify({'error': 'Invalid time period.'}), 400

    # Fetch stock data
    stock = yf.Ticker(ticker)

    # Get historical data
    history = stock.history(period=period)

    if history.empty:
        return jsonify({'error': 'No data found for the given ticker and period.'}), 404

    # Convert the history DataFrame to a list of dictionaries, converting dates to strings
    history.reset_index(inplace=True)
    history['Date'] = history['Date'].dt.strftime('%Y-%m-%d')  # Format date as string
    history_data = history.to_dict(orient='records')  # Convert DataFrame to list of dicts

    # Extract relevant stats
    data = {
        'Ticker': ticker,
        'Name': stock.info.get('longName', 'N/A'),
        'Current Price': get_current_price(ticker),
        'Market Cap': stock.info.get('marketCap', 'N/A'),
        'PE Ratio': stock.info.get('trailingPE', 'N/A'),
        '52 Week High': stock.info.get('fiftyTwoWeekHigh', 'N/A'),
        '52 Week Low': stock.info.get('fiftyTwoWeekLow', 'N/A'),
        'Recent History': history_data  # Include the formatted history data
    }

    return jsonify(data)


@app.route('/api/get_analysis', methods=['GET'])
def get_analysis():
    ticker = request.args.get('ticker')
    period = request.args.get('period')
    stock = yf.Ticker(ticker)
    history = stock.history(period=period)
    
    if history.empty:
        return jsonify({'error': 'No data found for the given ticker and period.'}), 404
    
    # Calculate simple moving averages and basic statistics
    history['SMA_5'] = history['Close'].rolling(window=5).mean()
    history['SMA_20'] = history['Close'].rolling(window=20).mean()
    
    # Calculate price changes
    history['Price_Change'] = history['Close'].pct_change()
    history['Price_Change_5d'] = history['Close'].pct_change(periods=5)
    
    # Simple prediction using linear trend
    x = np.arange(len(history))
    y = history['Close'].values
    coeffs = np.polyfit(x, y, 1)
    
    # Predict next 5 days
    future_x = np.arange(len(history), len(history) + 5)
    predicted_values = np.polyval(coeffs, future_x)
    
    # Get recent data for comparison
    recent_dates = history.index[-10:].strftime('%Y-%m-%d').tolist()
    recent_prices = history['Close'][-10:].tolist()
    
    # Prepare response
    analysis_data = {
        'Ticker': ticker,
        'Recent_Dates': recent_dates,
        'Recent_Prices': recent_prices,
        'Predicted_Dates': [d.strftime('%Y-%m-%d') for d in pd.date_range(history.index[-1] + pd.Timedelta(days=1), periods=5, freq='D')],
        'Predicted_Values': predicted_values.tolist(),
        'Current_Price': float(history['Close'].iloc[-1]),
        'SMA_5': float(history['SMA_5'].iloc[-1]) if not pd.isna(history['SMA_5'].iloc[-1]) else None,
        'SMA_20': float(history['SMA_20'].iloc[-1]) if not pd.isna(history['SMA_20'].iloc[-1]) else None,
        'Price_Change_1d': float(history['Price_Change'].iloc[-1]) if not pd.isna(history['Price_Change'].iloc[-1]) else None,
        'Price_Change_5d': float(history['Price_Change_5d'].iloc[-1]) if not pd.isna(history['Price_Change_5d'].iloc[-1]) else None
    }
    
    return jsonify(analysis_data)

if __name__ == '__main__':
    app.run(debug=True, port=3001)