import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { theme } from "../theme";

const NotFoundPage: React.FC = () => {
  return (
    <Page>
      <Code>404</Code>
      <Message>Page not found</Message>
      <Back to="/dashboard">Go to dashboard</Back>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.bg};
  color: ${theme.text};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Code = styled.div`
  font-size: 4rem;
  font-weight: 700;
  color: ${theme.accent};
  margin-bottom: 0.5rem;
`;

const Message = styled.p`
  font-size: 1.25rem;
  color: ${theme.textMuted};
  margin-bottom: 1.5rem;
`;

const Back = styled(Link)`
  color: ${theme.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default NotFoundPage;
