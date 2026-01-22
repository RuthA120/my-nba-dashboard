export async function favoritePlayer(playerId) {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/players/favorite-player", {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ playerId }) 
  });

  if (!res.ok) {
    throw new Error("Failed to favorite player");
  }

  return res.json();
}

export async function removeFavoritePlayer(playerId){
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/players/remove-favorite-player", {
        method: "DELETE", 
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playerId }) 
    });

    if (!res.ok) {
        throw new Error("Failed to favorite player");
    }

    return res.json();
}

export async function isFavoritePlayer(playerId){
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/players//is-favorite/${playerId}`, {
        method: "GET", 
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playerId }) 
    });

    if (!res.ok) {
        throw new Error("Failed to fetch if player is favorited");
    }

    return res.json();
}

export async function favoriteTeam(teamId) {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/teams/favorite-team", {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ teamId }) 
  });

  if (!res.ok) {
    throw new Error("Failed to favorite team");
  }

  return res.json();
}

export async function removeFavoriteTeam(teamId){
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/teams/remove-favorite-team", {
        method: "DELETE", 
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamId }) 
    });

    if (!res.ok) {
        throw new Error("Failed to favorite team");
    }

    return res.json();
}

export async function isFavoriteTeam(teamId){
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/teams//is-favorite/${teamId}`, {
        method: "GET", 
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamId }) 
    });

    if (!res.ok) {
        throw new Error("Failed to fetch if team is favorited");
    }

    return res.json();
}

export async function fetchUserStats(userId) {
  const res = await fetch(`http://localhost:5000/api/users/${userId}/stats`);
  if (!res.ok) throw new Error("Failed to fetch user stats");
  return res.json();
}
