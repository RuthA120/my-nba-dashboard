const BASE_URL = "http://localhost:5000/api/roty/roty-model";

export async function fetchTop5Rookies() {
  const res = await fetch(BASE_URL);
  return res.json();
}
