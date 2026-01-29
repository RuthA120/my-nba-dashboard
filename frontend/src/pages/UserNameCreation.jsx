import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserNameCreation.css';

export default function UserNameCreation() {
  const [username, setUsername] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const scriptLines = [
    "Welcome to the NBA Dashboard.",
    "Here, you can build MVPs, discover player similarities, and more.",
    "Before you log onto your dashboard...",
    "...choose a username for your page."
  ];

  useEffect(() => {
    if (currentLine < scriptLines.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLine(prev => prev + 1);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (currentLine === scriptLines.length - 1) {
      const timer = setTimeout(() => {
        setShowInput(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username) {
            setError('Please enter a username');
            return;
        }

        const userId = localStorage.getItem("user_id");
        console.log("Stored user_id:", localStorage.getItem("user_id"));
        try {
          const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:5000/username-creation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });


          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Username creation failed");
          
          setShowWelcome(true);
          setTimeout(() => navigate('/nba-dashboard'), 3000);
        } 
        
        catch (err) {
          setError(err.message);
        }
    };


  return (
    <div className="username-page">
  {showWelcome ? (
    <h1 className="fade-text">Welcome to NBA Dashboard @{username}!</h1>
  ) : !showInput ? (
    <h1 key={currentLine} className="fade-text">
      {scriptLines[currentLine]}
    </h1>
  ) : (
    <form onSubmit={handleSubmit}>
      <div className="user-signup">
        <h1 className="username-text">Username:</h1>
        <input
          className="username-input"
          placeholder="Enter username..."
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">&rarr;</button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </form>
  )}
</div>

  );
}
