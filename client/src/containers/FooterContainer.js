import React from 'react';
import { Link } from 'react-router-dom';

export default function FooterContainer() {
    return (
      <div>
        <div className="footer-bar">
          <div className="footer-nav">
            <Link to="/">HOME</Link>
            {/* <p>ABOUT</p> */}
            <Link to="/learn-more">LEARN MORE</Link>
            {/* <p>SELL YOUR HOME</p> */}
            <Link to="/contact">CONTACT</Link>
          </div>
        </div>
      </div>
    );
}
