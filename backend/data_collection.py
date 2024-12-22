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
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout
from sklearn.preprocessing import StandardScaler, MinMaxScaler


app = Flask(__name__)
# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # SQLite database
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # JWT secret key

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app)

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
    target_y = history['Close']
    x_feat = history.iloc[:, 0:3]  # Use Open, High, Low as features

    sc = StandardScaler()
    x_ft = sc.fit_transform(x_feat.values)
    x_ft = pd.DataFrame(columns=x_feat.columns, data=x_ft, index=x_feat.index)

    combined_data = pd.concat([x_ft, target_y], axis=1).dropna()
    n_steps = 2

    def lstm_split(data, n_steps):
        x, y = [], []
        for i in range(len(data) - n_steps + 1):
            x.append(data[i:i + n_steps, :-1])
            y.append(data[i + n_steps - 1, -1])
        return np.array(x), np.array(y)

    x1, y1 = lstm_split(combined_data.values, n_steps=n_steps)

    train_split = 0.8
    split_idx = int(np.ceil(len(x1) * train_split))
    data_index = combined_data.index

    x_train, x_test = x1[:split_idx], x1[split_idx:]
    y_train, y_test = y1[:split_idx], y1[split_idx:]
    x_test_date = data_index[split_idx:]

    # Scale target variable
    y_scaler = MinMaxScaler()
    y_train = y_scaler.fit_transform(y_train.reshape(-1, 1))
    y_test = y_scaler.transform(y_test.reshape(-1, 1))

    # Build and train LSTM model
    lstm = Sequential()
    lstm.add(LSTM(32, input_shape=(x_train.shape[1], x_train.shape[2]), activation='relu'))
    lstm.add(Dense(1))
    lstm.compile(loss='mean_squared_error', optimizer='adam')

    lstm.fit(x_train, y_train, epochs=50, batch_size=4, verbose=0, shuffle=False)

    # Predict on test data
    y_pred = lstm.predict(x_test)
    y_pred = y_scaler.inverse_transform(y_pred)
    y_test = y_scaler.inverse_transform(y_test)

    # Ensure `x_test_date` matches `y_test`
    x_test_date = x_test_date[:len(y_test)]

    # Prepare response
    analysis_data = {
        'Ticker': ticker,
        'Dates': x_test_date.strftime('%Y-%m-%d').tolist(),
        'True Values': y_test.flatten().tolist(),
        'Predicted Values': y_pred.flatten().tolist()
    }

    return jsonify(analysis_data)

if __name__ == '__main__':
    app.run(debug=True)