const BASE_URL = "http://localhost:5000/api/teams";

export async function fetchTeams() {
    const res = await fetch("http://localhost:5000/api/teams/", {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    });
    return res.json();
}

export async function fetchTeamById(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/teams/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw data;
  }

  return data;
}

export async function fetchTeamRoster(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/teams/${id}/roster`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw data;
  }

  return data;
}
