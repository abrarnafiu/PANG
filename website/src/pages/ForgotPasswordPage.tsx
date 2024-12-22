import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';
import NavigationBar from '../components/Navbar';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleForgotPassword = async () => {
        try {
            const response = await api.post('/forgot', { email });
            setMessage('A security code has been sent to your email.');
        } catch (error) {
            setMessage('Error sending security code. Please try again.');
        }
    };

    return (
        <Page>
            <NavigationBar />
            <Container>
                <ForgotPasswordCard>
                    <h1>Forgot Password?</h1>
                    <p>Enter your email address, and we will send you a security code to reset your password.</p>
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleForgotPassword}>Send Security Code</Button>
                    {message && <Message>{message}</Message>}
                </ForgotPasswordCard>
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

const ForgotPasswordCard = styled.div`
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
    box-sizing: border-box;
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
    &:hover {
        background-color: #0056b3;
    }
`;

const Message = styled.p`
    margin-top: 1rem;
    font-size: 0.9rem;
`;

export default ForgotPassword;
