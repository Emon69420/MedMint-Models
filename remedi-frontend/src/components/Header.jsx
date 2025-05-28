import React, { useState } from "react";
import "./Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">ReMedi</div>

        <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
          <a href="#platform">Platform</a>
          <a href="#solutions">Solutions</a>
          <a href="#resources">Resources</a>
          <a href="#company">Company</a>
        </nav>

        <div className="right-side">
          <button className="demo-button">Request Demo</button>
          <div className="hamburger" onClick={toggleMenu}>
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`bar ${menuOpen ? "open" : ""}`}></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
