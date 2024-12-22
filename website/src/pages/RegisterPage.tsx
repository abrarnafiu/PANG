import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import NavigationBar from '../components/Navbar';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            const response = await api.post('/register', { username, password });
            alert(response.data.message);
            window.location.href = '/login'; // Redirect to login page
        } catch (error) {
            alert("Error during registration");
        }
    };

    return (
        <Page>
            <NavigationBar />
            <Container>
                <RegisterCard>
                    <h1>Create an Account</h1>
                    <p>Join us today and start your journey!</p>
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
                    <Button onClick={handleRegister}>Register</Button>
                    <Divider />
                    <SecondaryText>
                        Already have an account? <a href="/login">Login</a>
                    </SecondaryText>
                </RegisterCard>
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

const RegisterCard = styled.div`
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

export default Register;
