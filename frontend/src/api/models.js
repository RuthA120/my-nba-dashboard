const BASE_URL = "http://localhost:5000/api/roty/roty-model";

export async function fetchTop5Rookies() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/roty/roty-model", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
}

