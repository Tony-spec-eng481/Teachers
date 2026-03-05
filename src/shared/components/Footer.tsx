import React from "react";
import "../styles/components/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <h3 className="footer-title">Trespics School</h3>

        <p className="footer-description">
          Empowering minds, shaping futures with excellence in education.
        </p>

        <div className="footer-socials">
          <a href="#" className="footer-link">
            Facebook
          </a>
          <a href="#" className="footer-link">
            Twitter
          </a>
          <a href="#" className="footer-link">
            Instagram
          </a>
        </div>

        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Trespics School. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
