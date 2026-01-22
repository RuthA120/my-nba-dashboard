from nba_api.stats.endpoints import commonplayerinfo
import psycopg2
import time
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

# Get players missing jersey
cur.execute("""
    SELECT id, full_name, is_active
    FROM players
    WHERE jersey IS NULL;
""")

players_to_update = cur.fetchall()
print(f"Updating jersey numbers for {len(players_to_update)} players...")

updated = 0

for player_id, name, is_active in players_to_update:
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        df = info.get_data_frames()[0]

        jersey = df.loc[0, "JERSEY"]
        team_name = df.loc[0, "TEAM_NAME"]

        jersey_value = int(jersey) if jersey and jersey.isdigit() else None
        final_team = team_name if is_active else "Not playing"

        cur.execute("""
            UPDATE players
            SET jersey = %s,
                team_name = %s
            WHERE id = %s;
        """, (jersey_value, final_team, player_id))

        updated += 1
        time.sleep(0.6)  # VERY IMPORTANT

    except Exception as e:
        print(f"Skipping {name}: {e}")

conn.commit()
cur.close()
conn.close()

print(f"Updated {updated} jerseys successfully ✅")
