import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import myRegisterImage from '../assets/Register-IMG.jpg';
import myRegisterAvatar from '../assets/Register-Avatar.png';
import myBasketballDesign from '../assets/Basketball-Design.png';

export default function Register() {

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="box">
        <img 
          src={myRegisterImage}
          alt="Register Image" 
          className="side-image" 
        />
      </div>
      <div className="form-container">
        <div className='form-box'>
          <img
            src={myRegisterAvatar}
            alt="Avatar"
            className="register-avatar"
          />
          <h2 className="header">Create an Account</h2>
          <hr className="register-line"></hr>

          <form onSubmit={handleSubmit}>
            <h3 className="email-header">Email</h3>
            <input type="email" className="email-input" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />

            <h3 className ="password-header">Password</h3>
            <input type="password" className="password-input" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="register-button">Sign Up</button>
            {error && <p>{error}</p>}
          </form>

          <a href="/login" className="login-link">Login to existing account</a>
        </div>
      </div>

    </div>
  );
}
