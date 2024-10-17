import React from 'react';
import './styles.css';

const CanaryChat: React.FC = () => {
    return (
        <div>
            <div className="banner">
                <div className="name">Canary-Chat</div>
                <div className="top-buttons">
                    <button onClick={() => window.location.href='https://chat.quizzity.tech/login'}>Login</button>
                    <button onClick={() => window.location.href='https://chat.quizzity.tech/register'}>Sign Up</button>
                </div>
            </div>
            <div className="container">
                <div className="logo">
                    <img src="/logo.png" alt="Canary-Chat Logo" />
                </div>
                <h1>Welcome to Canary-Chat</h1>
                <div className="buttons">
                    <button className="btn login-btn" onClick={() => window.location.href='https://chat.quizzity.tech/login'}>Login</button>
                    <button className="btn register-btn" onClick={() => window.location.href='https://chat.quizzity.tech/register'}>Register</button>
                    <button className="btn download-btn" onClick={() => window.location.href='https://download.quizzity.tech/'}>Downloads</button>
                </div>
            </div>
            <style jsx>{`
                body {
                    font-family: "Times New Roman", Times, serif;
                    background-color: #49c992; /* Main background color */
                }
                .banner {
                    width: calc(100% - 60px); /* Adjust width to leave more space on the sides */
                    background-color: #F9B006; /* Canary yellow */
                    color: white;
                    padding: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: fixed;
                    top: 10px; /* Adjust top position to leave space above */
                    left: 20px; /* Center the banner */
                    right: 40px; /* More space on the right */
                    border-radius: 20px; /* Rounded corners */
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
                    border-radius: 20px; /* More rounded corners */
                }
                .container {
                    margin-top: 80px; /* Adjust this value based on the height of your banner */
                }
                .buttons .btn {
                    background-color: #F9B006; /* Canary yellow */
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    cursor: pointer;
                    border-radius: 20px; /* More rounded corners */
                    margin: 5px; /* Adjust margin for spacing between buttons */
                }
                .buttons .btn.login-btn {
                    /* Specific styles for login button if needed */
                }
                .buttons .btn.register-btn {
                    /* Specific styles for register button if needed */
                }
                .buttons .btn.download-btn {
                    /* Specific styles for download button if needed */
                }
            `}</style>
        </div>
    );
};

export default CanaryChat;
