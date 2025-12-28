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