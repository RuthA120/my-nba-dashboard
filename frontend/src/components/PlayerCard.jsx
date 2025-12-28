import { Link } from "react-router-dom";
import './PlayerCard.css';

export default function PlayerCard({ player }) {
  const imageUrl = `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`;

  return (
    <Link to={`/players-search/${player.id}`} style={{ textDecoration: "none" }}>
      <div className="player-profile-div">
        <div className="player-image-circle">
          <img
            src={imageUrl}
            alt={player.name}
            className="player-image"
            onError={(e) => {
              e.target.src = "/default-player.png"; 
            }}
          />
        </div>

        <h3 className="player-name">{player.name}</h3>
        <p className="team-name">{player.team}</p>
      </div>
    </Link>
  );
}
