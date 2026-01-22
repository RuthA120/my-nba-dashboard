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

cur.execute("SELECT id FROM players WHERE draft_year IS NULL AND draft_pick IS NULL;")
player_ids = [row[0] for row in cur.fetchall()]

print(f"Found {len(player_ids)} players")

update_query = """
UPDATE players
SET draft_year = %s,
    draft_pick = %s
WHERE id = %s
AND draft_year IS NULL
AND draft_pick IS NULL;
"""

for i, player_id in enumerate(player_ids, start=1):
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        df = info.get_data_frames()[0]

        draft_year = df.loc[0, "DRAFT_YEAR"]
        draft_pick = df.loc[0, "DRAFT_NUMBER"]

        # Convert strings like 'Undrafted'
        if draft_year == "Undrafted":
            draft_year = 0000
            draft_pick = 0
        else:
            draft_year = int(draft_year)
            draft_pick = int(draft_pick)

        cur.execute(update_query, (draft_year, draft_pick, player_id))
        conn.commit()

        print(f"[{i}/{len(player_ids)}] Updated player {player_id}")

        time.sleep(0.6)  

    except Exception as e:
        conn.rollback()
        print(f"Failed for player {player_id}: {e}")
        time.sleep(1)

cur.close()
conn.close()
print("Draft ingestion complete")
