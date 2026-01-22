from nba_api.stats.endpoints import leaguedashplayerstats
import psycopg2
import time

import os
from dotenv import load_dotenv
load_dotenv()

POST_GRES_PASSWORD = os.getenv("POST_GRES_PASSWORD")

conn = psycopg2.connect(
    host="localhost",
    database="nba-dashboard",
    user="postgres",
    password=POST_GRES_PASSWORD
)
cur = conn.cursor()

seasons = [
    "2025-26"
]

insert_player = """
INSERT INTO players (id, full_name)
VALUES (%s, %s)
ON CONFLICT (id) DO NOTHING;
"""

insert_player_season = """
INSERT INTO player_stats (
    player_id, season, team_name,
    games_played, minutes_per_game, points, rebounds, assists, steals, blocks, turnovers,
    field_goal_pct, three_point_pct, free_throw_pct
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (player_id, season, team_name) DO UPDATE SET
    games_played = EXCLUDED.games_played,
    minutes_per_game = EXCLUDED.minutes_per_game,
    points = EXCLUDED.points,
    rebounds = EXCLUDED.rebounds,
    assists = EXCLUDED.assists,
    steals = EXCLUDED.steals,
    blocks = EXCLUDED.blocks,
    turnovers = EXCLUDED.turnovers,
    field_goal_pct = EXCLUDED.field_goal_pct,
    three_point_pct = EXCLUDED.three_point_pct,
    free_throw_pct = EXCLUDED.free_throw_pct;
"""

for season in seasons:
    print(f"Processing players for {season}...")

    try:
        stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            per_mode_detailed="PerGame"
        )

        df = stats.get_data_frames()[0]
        inserted = 0

        for _, row in df.iterrows():
            player_id = int(row["PLAYER_ID"])
            player_name = row["PLAYER_NAME"]
            team_name = row["TEAM_ABBREVIATION"]

            # Insert player (once)
            cur.execute(insert_player, (player_id, player_name))

            # Insert season stats
            cur.execute(
                insert_player_season,
                (
                    player_id,
                    season,
                    team_name,
                    int(row["GP"]),
                    float(row["MIN"]),
                    float(row["PTS"]),
                    float(row["REB"]),
                    float(row["AST"]),
                    float(row["STL"]),
                    float(row["BLK"]),
                    float(row["TOV"]),
                    float(row["FG_PCT"]),
                    float(row["FG3_PCT"]),
                    float(row["FT_PCT"]),
                )
            )

            inserted += 1

        conn.commit()
        print(f"Inserted/Updated {inserted} player-season rows for {season}")

        time.sleep(1)

    except Exception as e:
        conn.rollback()
        print(f"Failed for season {season}: {e}")

# -----------------------------
# Cleanup
# -----------------------------
cur.close()
conn.close()

print("Players ingestion complete ✅")
