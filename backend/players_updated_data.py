from nba_api.stats.static import players as static_players
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

# -----------------------------
# Load static player data
# -----------------------------
static_players_list = static_players.get_players()

static_lookup = {
    p["id"]: {
        "first_name": p["first_name"],
        "last_name": p["last_name"],
        "is_active": p["is_active"]
    }
    for p in static_players_list
}

# -----------------------------
# Fetch players already ingested
# -----------------------------
cur.execute("SELECT id FROM players;")
player_ids = [row[0] for row in cur.fetchall()]

updated = 0

for player_id in player_ids:
    if player_id not in static_lookup:
        continue

    meta = static_lookup[player_id]

    # Get last season played (for jersey & team)
    cur.execute("""
        SELECT team_name
        FROM player_stats
        WHERE player_id = %s
        ORDER BY season DESC
        LIMIT 1;
    """, (player_id,))

    result = cur.fetchone()

    if meta["is_active"]:
        team_name = result[0] if result else "Not playing"
    else:
        team_name = "Not playing"

    # Jersey: last known jersey (nullable)
    cur.execute("""
        SELECT jersey
        FROM players
        WHERE id = %s;
    """, (player_id,))
    jersey = cur.fetchone()[0]

    cur.execute("""
        UPDATE players
        SET
            first_name = %s,
            last_name = %s,
            is_active = %s,
            team_name = %s
        WHERE id = %s;
    """, (
        meta["first_name"],
        meta["last_name"],
        meta["is_active"],
        team_name,
        player_id
    ))

    updated += 1

conn.commit()
cur.close()
conn.close()

print(f"Updated metadata for {updated} players ✅")
