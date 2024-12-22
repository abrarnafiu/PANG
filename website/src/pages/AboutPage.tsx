import React from "react";
import styled from "styled-components";
import NavigationBar from "../components/Navbar";

// About page component
const About = () => {
  return (
    <Container>
      <NavigationBar />
      <CompanyDescription>
        <h1>About Our Company</h1>
        <p>
          Welcome to our company! We are dedicated to providing the best service
          and innovative solutions in the industry. Our team is made up of
          passionate individuals who believe in delivering high-quality results
          and exceptional customer experiences.
        </p>
      </CompanyDescription>

      <TeamSection>
        <h2>Meet the Team</h2>
        <TeamGrid>
          <TeamCard>
            <img src="/path/to/your-image.jpg" alt="Your Name" />
            <h3>Abrar</h3>
            <p>Developer</p>
          </TeamCard>

          <TeamCard>
            <img src="/path/to/friend1-image.jpg" alt="Friend 1" />
            <h3>Rayn</h3>
            <p>Developer</p>
          </TeamCard>

          <TeamCard>
            <img src="/path/to/friend2-image.jpg" alt="Friend 2" />
            <h3>Jeffrey</h3>
            <p>Developer</p>
          </TeamCard>

          <TeamCard>
            <img src="/path/to/friend2-image.jpg" alt="Friend 2" />
            <h3>Pramshu</h3>
            <p>Developer</p>
          </TeamCard>
          {/* Add more TeamCards as needed */}
        </TeamGrid>
      </TeamSection>
    </Container>
  );
};
// Container for the About page
const Container = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
`;

// Company description section
const CompanyDescription = styled.section`
  text-align: center;
  margin: 40px 0;

  h1 {
    font-size: 2.5rem;
    color: #333;
  }

  p {
    font-size: 1.2rem;
    color: #555;
    max-width: 800px;
    margin: 20px auto;
    line-height: 1.6;
  }
`;

// Team section with the title and grid layout
const TeamSection = styled.section`
  text-align: center;
  margin: 60px 0;

  h2 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 30px;
  }
`;

// Grid layout for team cards
const TeamGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

// Individual team card styling
const TeamCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 200px;
  padding: 20px;
  text-align: center;

  img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 15px;
  }

  h3 {
    font-size: 1.2rem;
    color: #333;
    margin: 10px 0;
  }

  p {
    font-size: 0.9rem;
    color: #777;
  }
`;

export default About;
