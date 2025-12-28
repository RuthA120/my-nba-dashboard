import { Link } from "react-router-dom";
import "./TeamCard.css";

export default function TeamCard({ team }) {
  // NBA team logo CDN (uses team ID)
  const logoUrl = `https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`;

  return (
    <Link
      to={`/teams/${encodeURIComponent(team.name)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="team-card">
        <div className="team-logo-circle">
          <img
            src={logoUrl}
            alt={team.name}
            className="team-logo"
          />
        </div>

        <h3 className="team-name">{team.name}</h3>
      </div>
    </Link>
  );
}
