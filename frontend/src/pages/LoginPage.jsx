import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import myLoginImage from '../assets/Login-IMG.jpg';
import myLoginAvatar from '../assets/Login-Avatar.png';

export default function Login() {

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await fetch("http://localhost:5000/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Login failed");

          localStorage.setItem("token", data.token);

          if (!data.has_username) {
            navigate("/username-creation");
          } 
          else {
            navigate("/players-search");
          }
        } 
        
        catch (err) {
          setError(err.message);
        }
    };

  return (
      <div className="login-page">
        <div className="login-form-container">
          <div className='login-form-box'>
            <img
              src={myLoginAvatar}
              alt="Avatar"
              className="login-avatar"
            />

            <form onSubmit={handleSubmit}>
              <h2 className="login-header">Welcome Back!</h2>
              <hr className="login-line"></hr>
    
              <h3 className ="login-email-header">Email</h3>
              <input name="email" type="text" className="email-login-input" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
    
              <h3 className ="login-password-header">Password</h3>
              <input name="password" type="password" className="password-login-input" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          
              <button type="submit" className="login-button">Login</button>
              {error && <p>{error}</p>}
            </form>
            
            <div className='login-options'>
              <a href="/register" className="loginpage-link">Sign up for a new<br></br>account</a>
            </div>
          </div>
        </div>
        <div className="login-box">
          <img 
            src={myLoginImage}
            alt="Login Image" 
            className="side-login-image" 
          />
        </div>
      </div>
    );
}
