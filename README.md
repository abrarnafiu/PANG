# PANG - Algorithmic Trading Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org)

A comprehensive algorithmic trading platform that provides real-time stock data analysis, predictive modeling, and interactive visualization tools for informed trading decisions.

## 🚀 Features

### Core Functionality
- **Real-time Stock Data**: Fetch live market data using Yahoo Finance API
- **Technical Analysis**: Advanced charting with moving averages and trend analysis
- **Predictive Modeling**: Linear regression-based price predictions
- **Interactive Dashboards**: Modern React-based user interface
- **User Authentication**: Secure JWT-based authentication system
- **Data Visualization**: Interactive charts using Chart.js and React-ChartJS-2

### Technical Analysis Tools
- Simple Moving Averages (SMA 5-day, 20-day)
- Price change calculations (1-day, 5-day)
- Historical data analysis
- Trend prediction algorithms
- Market cap and P/E ratio analysis

### User Experience
- Responsive design with styled-components
- Multi-page navigation with React Router
- Protected routes for authenticated users
- Real-time data updates
- Error handling and validation

## 🏗️ Architecture

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite for user management
- **Authentication**: JWT tokens with Flask-JWT-Extended
- **Security**: Bcrypt password hashing
- **CORS**: Enabled for cross-origin requests
- **Data Source**: Yahoo Finance API via yfinance

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Styled-components for CSS-in-JS
- **Routing**: React Router for navigation
- **Charts**: Chart.js with React-ChartJS-2
- **HTTP Client**: Axios for API communication

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Python 3.9+** (recommended: Python 3.9.6 or 3.13)
- **Node.js 16+** (recommended: Node.js 18+)
- **npm** or **yarn** package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PANG
```

### 2. Backend Setup

Navigate to the backend directory and install Python dependencies:

```bash
cd backend

# Install dependencies using pip3 (recommended)
pip3 install yfinance flask flask-cors matplotlib pandas numpy flask-sqlalchemy flask-bcrypt flask-jwt-extended

# Or create a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt  # If you create a requirements.txt file
```

### 3. Frontend Setup

Navigate to the website directory and install Node.js dependencies:

```bash
cd website
npm install
```

## 🚀 Running the Application

### Start the Backend Server

```bash
cd backend
python3 data_collection.py
```

The Flask server will start on `http://localhost:5000`

### Start the Frontend Development Server

```bash
cd website
npm run dev
```

The React development server will start on `http://localhost:5173`

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /register
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

#### Login User
```http
POST /login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

#### Protected Route
```http
GET /protected
Authorization: Bearer <your_jwt_token>
```

### Data Endpoints

#### Get Stock Data
```http
GET /api/get_data?ticker=AAPL&period=1mo
```

**Parameters:**
- `ticker` (required): Stock symbol (e.g., AAPL, GOOGL, MSFT)
- `period` (required): Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

**Response:**
```json
{
  "Ticker": "AAPL",
  "Name": "Apple Inc.",
  "Current Price": 150.25,
  "Market Cap": 2500000000000,
  "PE Ratio": 25.5,
  "52 Week High": 180.0,
  "52 Week Low": 120.0,
  "Recent History": [...]
}
```

#### Get Stock Analysis
```http
GET /api/get_analysis?ticker=AAPL&period=1mo
```

**Response:**
```json
{
  "Ticker": "AAPL",
  "Recent_Dates": ["2024-01-01", "2024-01-02", ...],
  "Recent_Prices": [150.0, 151.5, ...],
  "Predicted_Dates": ["2024-01-15", "2024-01-16", ...],
  "Predicted_Values": [155.0, 156.2, ...],
  "Current_Price": 150.25,
  "SMA_5": 149.8,
  "SMA_20": 148.5,
  "Price_Change_1d": 0.008,
  "Price_Change_5d": 0.025
}
```

## 🎯 Usage

### 1. User Registration/Login
- Navigate to `/register` to create a new account
- Use `/login` to authenticate existing users
- Access protected features after authentication

### 2. Stock Analysis
- Visit `/analysis?ticker=AAPL&period=1mo` for stock analysis
- View interactive charts showing historical and predicted prices
- Analyze technical indicators and moving averages

### 3. Data Exploration
- Use the API endpoints to fetch real-time stock data
- Integrate with your own trading algorithms
- Build custom analysis tools

## 🔧 Configuration

### Backend Configuration
Edit `backend/data_collection.py` to modify:
- Database URI
- JWT secret key
- CORS settings
- API endpoints

### Frontend Configuration
Edit `website/vite.config.ts` to modify:
- Development server settings
- Build configuration
- Proxy settings

## 🧪 Testing

### Backend Testing
```bash
cd backend
python3 -m pytest  # If you add pytest tests
```

### Frontend Testing
```bash
cd website
npm test  # If you add test scripts
```

## 📦 Project Structure

```
PANG/
├── backend/
│   ├── data_collection.py      # Main Flask application
│   ├── instance/
│   │   └── users.db           # SQLite database
│   └── __pycache__/           # Python cache files
├── website/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── Navbar.tsx
│   │   │   └── Protected.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── AnalysisPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── ...
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.tsx           # Main App component
│   │   └── main.tsx          # Entry point
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
└── README.md                 # This file
```

## 🚨 Troubleshooting

### Common Issues

#### Python Import Errors
```bash
# Ensure you're using the correct Python interpreter
which python3
/usr/bin/python3  # Should point to Python 3.9+

# Reinstall packages if needed
pip3 install --upgrade yfinance flask flask-cors
```

#### Node.js Dependency Issues
```bash
# Clear npm cache and reinstall
cd website
rm -rf node_modules package-lock.json
npm install
```

#### CORS Issues
- Ensure the Flask server is running on `http://localhost:5000`
- Check that CORS is enabled in the Flask app
- Verify the frontend is making requests to the correct backend URL

#### Database Issues
```bash
# Reset the database
cd backend
rm instance/users.db
python3 data_collection.py  # This will recreate the database
```

## 🔒 Security Considerations

- **JWT Secret**: Change the default JWT secret key in production
- **HTTPS**: Use HTTPS in production environments
- **Input Validation**: All user inputs are validated on the backend
- **Password Hashing**: Passwords are securely hashed using bcrypt
- **CORS**: Configure CORS settings appropriately for your domain

## 🚀 Deployment

### Backend Deployment
1. Set up a production WSGI server (e.g., Gunicorn)
2. Configure environment variables for database and JWT secrets
3. Use a production database (PostgreSQL recommended)
4. Set up proper logging and monitoring

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy the `dist` folder to a static hosting service
3. Configure environment variables for API endpoints
4. Set up proper caching and CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation and troubleshooting section

## 🔮 Future Enhancements

- [ ] Machine learning models for better predictions
- [ ] Real-time WebSocket connections
- [ ] Portfolio management features
- [ ] Advanced technical indicators
- [ ] Mobile application
- [ ] Paper trading simulation
- [ ] Social trading features
- [ ] Risk management tools

---

**Disclaimer**: This application is for educational and research purposes only. It is not intended as financial advice. Always do your own research before making investment decisions.
