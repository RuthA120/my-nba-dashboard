from nba_api.stats.static import teams
import psycopg2

import os
from dotenv import load_dotenv

POST_GRES_PASSWORD = os.getenv("POST_GRES_PASSWORD")

conn = psycopg2.connect(
    host="localhost",
    database="nba-dashboard",
    user="postgres",
    password=POST_GRES_PASSWORD
)
cur = conn.cursor()

cur = conn.cursor()

nba_teams = teams.get_teams()
print(f"Fetched {len(nba_teams)} teams from NBA API")

insert_query = """
INSERT INTO teams (id, full_name, city, conference, division)
VALUES (%s, %s, %s, %s, %s, %s)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    city = EXCLUDED.city
"""

for team in nba_teams:
    cur.execute(
        insert_query,
        (
            team["id"],
            team["full_name"],
            team["city"]
        )
    )

conn.commit()

cur.close()
conn.close()

print("Teams completed")
