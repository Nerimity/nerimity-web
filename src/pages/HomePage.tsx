import React from 'react';
import './styles.css';

const ADSChat: React.FC = () => {
    return (
        <div>
            <div className="banner">
                <div className="name">ADS-Chat</div>
                <div className="top-buttons">
                    <button onClick={() => window.location.href='https://chat.quizzity.tech/login'}>Login</button>
                    <button onClick={() => window.location.href='https://chat.quizzity.tech/register'}>Sign Up</button>
                </div>
            </div>
            <div className="container">
                <div className="logo">
                    <img src="/logo.png" alt="ADS-Chat Logo" />
                </div>
                <h1>Welcome to ADS-Chat</h1>
                <div className="buttons">
                    <button className="btn login-btn" onClick={() => window.location.href='https://chat.quizzity.tech/login'}>Login</button>
                    <button className="btn register-btn" onClick={() => window.location.href='https://chat.quizzity.tech/register'}>Register</button>
                    <button className="btn download-btn" onClick={() => window.location.href='https://download.quizzity.tech/'}>Downloads</button>
                </div>
            </div>
            <style jsx>{
                body {
                    font-family: "Times New Roman", Times, serif;
                }
                .banner {
                    width: 100%;
                    background-color: #F9B006; /* Canary yellow */
                    color: white;
                    padding: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 1000;
                }
                .banner .name {
                    font-size: 24px;
                    font-weight: bold;
                }
                .banner .top-buttons {
                    display: flex;
                    gap: 10px;
                    margin-right: 20px; /* Adjust this value to move buttons further left */
                }
                .banner .top-buttons button {
                    background-color: white;
                    color: #F9B006; /* Canary yellow */
                    border: none;
                    padding: 10px 20px;
                    cursor: pointer;
                }
                .container {
                    margin-top: 60px; /* Adjust this value based on the height of your banner */
                }
            }</style>
        </div>
    );
};

export default ADSChat;
