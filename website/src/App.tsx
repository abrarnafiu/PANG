import HomePage from './pages/HomePage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css'; 
import Solutions from './pages/SolutionsPage';
import GetStarted from './pages/GetStartedPage';
import About from './pages/AboutPage';
import Analysis from './pages/AnalysisPage';
import Register from './pages/RegisterPage';
import Login from './pages/LoginPage';
import Protected from './components/Protected';
import Forgot from './pages/ForgotPasswordPage';
const App: React.FC = () => {
  return (
    <Router>
            <Routes>
                <Route path="/" element={<HomePage />} /> 
                <Route path="/solutions" element={<Solutions />} /> 
                <Route path="/About" element={<About />} />
                <Route path='/get-started' element={<GetStarted />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/protected" element={<Protected />} />
                <Route path="/forgot" element={<Forgot />} />
            </Routes>
        </Router>
  );
};

export default App;
