import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTeams } from "../api/teams";
import TeamCard from "../components/TeamCard";
import SearchBar from "../components/SearchBar";
import NavBar from "../components/NavBar";
import { useNavigate } from 'react-router-dom';
import "./Teams.css";

export default function Teams() {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/teams/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load teams");
        }

        setTeams(data); 
      } catch (err) {
        if (err) {
          navigate("/");
        } 
      }
    };

    fetchTeams();
  }, []);


  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(query.toLowerCase())
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
          {filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}
