import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, username || undefined);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <Title>Create an account</Title>
        <Subtitle>Join and start tracking stocks</Subtitle>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Register"}
          </Button>
        </Form>
        <Footer>
          Already have an account? <Link to="/login">Sign in</Link>
        </Footer>
      </Card>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${theme.cardBg};
  border: 1px solid ${theme.border};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
`;

const Title = styled.h1`
  color: ${theme.text};
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${theme.textMuted};
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${theme.border};
  border-radius: 8px;
  color: ${theme.text};
  font-size: 1rem;
  &::placeholder {
    color: ${theme.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${theme.accent};
  }
`;

const ErrorMsg = styled.p`
  color: ${theme.error};
  font-size: 0.9rem;
  margin: 0;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background: ${theme.accent};
  color: ${theme.bg};
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.p`
  margin-top: 1.5rem;
  color: ${theme.textMuted};
  font-size: 0.9rem;
  a {
    color: ${theme.accent};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;

export default RegisterPage;
