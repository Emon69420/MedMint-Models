import React from "react";
import "./HeroSection.css";

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          End to End Toolkit For <br />
          <span>Medicinal Drug Discovery & Design</span>
        </h1>
        <p>
          Scout expands the scope of what AI can do and what you can bring to
          production, faster than ever imagined.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary">Try for free</button>
          <button className="btn-secondary">Talk with a Scout engineer</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
