import { useState } from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import BasketballGif from '../assets/basketball-loading.gif';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-box">
      <img src={BasketballGif} alt="Basketball" className="basketball-gif" />

      <h1 className="font small-heading">WELCOME TO</h1>
      <h1 className="font large-heading">NBA DASHBOARD</h1>

      <div className="button-container">
        <button id="home-register" onClick={() => navigate('/register')}>Sign Up</button>
        <button id="home-login" onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  );
}
