import React from 'react';
import mockup from '../assets/img/learn-more-phone.jpg';

const LandingPageContent = () => {
    return (
      <div className="landing-content-body">
        <div id="about" className="landing-info section-1">
          <div className="home-text-left">
            <h2 style={{fontSize: 40}}>Estimating solutions, simplified</h2>
            <p style={{ fontSize: 16 }}>Thinking about selling, buying, or refinancing? It helps to see what the property may be worth without spending hours on research. FreeHomeAppraisal.com gathers estimates from dozens of real estate websites, then averages those figures into one home value estimate. We will keep adding sources as the site grows.</p>
          </div>
        </div>
        <div className="landing-info section-2">
          <div className="home-text-center">
          <h2 style={{ fontSize: 40, color: 'white' }}>About FreeHomeAppraisal.com</h2>
          <p style={{ fontSize: 16, color: 'white' }}>FreeHomeAppraisal.com launched in 2019. It is built by a small team that has worked in real estate every day for more than 25 years. The goal is simple: give homeowners, buyers, and professionals a clear first look at estimated value so they can decide what to do next.</p>
          </div>
        </div>
        <div className="landing-info section-3">
          <div className="home-text-right">
            <div className="split">
              <div>
            <h2 style={{fontSize: 40}}>What is coming next</h2>
            <p style={{ fontSize: 16 }}>The site is still being improved. Please try the current tools. If something does not work, use the Contact page and tell us what you saw. Planned updates include more estimate sources, saved properties, and a way to correct listing details or add photos.</p>
              </div>
            <img src={mockup} style={{width: 400}} alt="FreeHomeAppraisal.com phone estimate preview" />

            </div>
          </div>
        </div>
        <div className="landing-info section-4">
          <div className="home-text-left">
            <h2 style={{fontSize: 40}}>How the estimate is built</h2>
            <p style={{ fontSize: 16 }}>FreeHomeAppraisal.com collects current figures from dozens of real estate websites and averages them into one report. Use it as a starting point, not as a final number for a contract or a loan.</p>
          </div>
        </div>
      </div>
    );
}

export default LandingPageContent;
