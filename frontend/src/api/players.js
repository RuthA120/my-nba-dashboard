const BASE_URL = "http://localhost:5000/api/players";

export async function fetchPlayers() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/players/", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch players");
  }

  return res.json();
}


export async function fetchPlayerById(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:5000/api/players/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  if (!res.ok) {
    throw new Error("Request failed");
  }

  return res.json();
}
