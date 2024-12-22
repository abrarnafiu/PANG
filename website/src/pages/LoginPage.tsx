import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import NavigationBar from '../components/Navbar';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [loginFailed, setLoginFailed] = useState(false);

    const handleLogin = async () => {
        try {
            const response = await api.post('/login', { username, password });
            setToken(response.data.access_token);
            localStorage.setItem('token', response.data.access_token); // Save token
            alert("Login successful!");
            setLoginFailed(false);
        } catch (error) {
            alert("Invalid credentials");
            setLoginFailed(true);
        }
    };

    return (
        <Page>
            <NavigationBar />
            <Container>
                <LoginCard>
                    <h1>Welcome Back</h1>
                    <p>Login to continue to your account</p>
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button onClick={handleLogin}>Login</Button>
                    <Divider />
                    <SecondaryText>
                        Don't have an account? <a href="/register">Register</a>
                    </SecondaryText>
                    {loginFailed && (
                        <ForgotText>
                            <span>Forgot your password?</span> <a href="/forgot">Click Here</a>
                        </ForgotText>
                    )}
                </LoginCard>
            </Container>
        </Page>
    );
};

// Styled Components
const Page = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f9f9f9;
`;

const Container = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const LoginCard = styled.div`
    width: 100%;
    max-width: 400px;
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;

    h1 {
        margin-bottom: 1rem;
        font-size: 1.8rem;
        color: #333;
    }

    p {
        margin-bottom: 2rem;
        color: #666;
        font-size: 1rem;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box; /* Add this line */
    &:focus {
        border-color: #007bff;
        outline: none;
    }
`;

const Button = styled.button`
    width: 100%;
    padding: 0.8rem;
    background-color: #007bff;
    color: #fff;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    box-sizing: border-box; /* Add this line */
    &:hover {
        background-color: #0056b3;
    }
`;

const Divider = styled.hr`
    border: 0;
    height: 1px;
    background: #ddd;
    margin: 1.5rem 0;
`;


const SecondaryText = styled.p`
    font-size: 0.9rem;
    color: #666;

    a {
        color: #007bff;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
`;

const ForgotText = styled.p`
    font-size: 0.9rem;
    color: red;

    a {
        color: #007bff;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    span {
        color: red;
    }
`;

export default Login;
