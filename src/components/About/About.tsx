import React from "react";
import "./About.css";
import { Link } from "react-router-dom";
import Navbar from "../layout/Navbar";
import sunil from "@/img/about/sunil.jpg";
import mitan from "@/img/about/mitan.jpg";
import rekha from "@/img/about/rekha.jpg";
import Footer from "../layout/Footer";
import SEOHead from "../SEO/SEOHead";
import { pageSEOConfig } from "@/config/seo";

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  { name: "Sunil Kapoor", role: "Founder & CEO", image:sunil },
  { name: "Vijender Mitan", role: "Co-Founder", image: mitan },
  { name: "Rekha Kapoor", role: "Co-Founder", image: rekha },
];

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageSEOConfig.about.title}
        description={pageSEOConfig.about.description}
        keywords={pageSEOConfig.about.keywords}
        url="https://expertisestation.com/about"
      />
        <Navbar />
    <div className="about-container">
      <h1 className="about-heading">
        Transforming Businesses Through <br />
        <span className="highlight">Strategic Excellence</span>
      </h1>

      <div className="about-us-container">
        <h1 className="about-heading">About Expertise Station</h1>
        <p className="about-text">
          Expertise Station is a <span className="highlight">premier consulting platform</span>, that connects clients with seasoned industry experts across various domains. Our mission is to empower businesses and individuals by providing strategic insights, expert advice, and customized solutions tailored to their unique needs. Whether you need guidance in <span className="highlight">technology, finance, marketing, operations, or strategy</span>, our experts are here to assist you every step of the way.
        </p>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <i className="fas fa-users"></i>
          <h3>300+</h3>
          <p>Experts Available</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-bullseye"></i>
          <h3>95%</h3>
          <p>Success Rate</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-clock"></i>
          <h3>25+</h3>
          <p>Years Experienced Experts</p>
        </div>
        <div className="stat-card">
          <i className="fas fa-award"></i>
          <h3>15+</h3>
          <p>Service's Domain Available</p>
        </div>
      </div>

      <h2 className="section-heading">Our Values</h2>
      <div className="values-section">
        {['Innovation', 'Excellence', 'Integrity', 'Partnership'].map((value, index) => (
          <div className="value-card" key={index}>
            <h3>{value}</h3>
            <p>We {value.toLowerCase()} in every consulting engagement.</p>
          </div>
        ))}
      </div>

      {/* <h2 className="section-heading">Our Leadership Team</h2>
      <div className="team-section">
        {teamMembers.map((member) => (
          <div className="team-card" key={member.name}>
            <img src={member.image} alt={member.name} />
            <h3>{member.name}</h3>
            <p>{member.role}</p>
          </div>
        ))}
      </div> */}
    </div>
    <Footer />
  </div>
  );
};

export default About;
