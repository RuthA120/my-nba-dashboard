const BASE_URL = "http://localhost:5000/api/teams";

export async function fetchTeams() {
    const res = await fetch(BASE_URL);
    return res.json();
}

export async function fetchTeamById(team_name){
    const res = await fetch(`${BASE_URL}/${team_name}`);
    return res.json();
}
