import React from 'react';
import './styles.css'; // Import the CSS file if you have additional styles

const HomePage: React.FC = () => {
  return (
    <div>
      <header className="banner">
        <div className="banner-title">ADS-Chat</div>
        <div className="banner-buttons">
          <button onClick={() => window.location.href='https://chat.quizzity.tech/login'}>
            Login
          </button>
          <button onClick={() => window.location.href='https://chat.quizzity.com/register'}>
            Register
          </button>
          <button onClick={() => window.location.href='https://chat.quizzity.com/app/'}>
            Open App
          </button>
        </div>
      </header>
      <main className="container">
        <div className="logo">
          <img src="logo.png" alt="ADS-Chat Logo" />
        </div>
        <h1>Welcome to ADS-Chat</h1>
        <div className="buttons">
          <button className="btn login-btn" onClick={() => window.location.href='https://chat.quizzity.tech/login'}>
            Login
          </button>
          <button className="btn register-btn" onClick={() => window.location.href='https://chat.quizzity.tech/register'}>
            Register
          </button>
          <button className="btn download-btn" onClick={() => window.location.href='https://download.quizzity.tech/'}>
            Downloads
          </button>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
