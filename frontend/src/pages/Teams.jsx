import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTeams } from "../api/teams";
import TeamCard from "../components/TeamCard";
import SearchBar from "../components/SearchBar";
import NavBar from "../components/NavBar";
import "./Teams.css";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchTeams().then(setTeams);
  }, []);

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <NavBar />


      <div
        style={{
          paddingTop: "7rem",
          paddingLeft: "5rem",
          paddingRight: "4rem",
          paddingBottom: "5rem"
        }}
      >
        <SearchBar query={query} setQuery={setQuery} />
      </div>

      <div className="teams-box">
        <Link to={`/players-search`}>
            <div className="players-tab">
                PLAYER SEARCH
            </div>
        </Link>
        <Link to={`/teams-search`}>
            <div className="teams-tab">
                TEAM SEARCH
            </div>
        </Link>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            rowGap: "2rem",
            columnGap: "1rem",
            padding: "2rem 5rem"
          }}
        >
          {filtered.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}
