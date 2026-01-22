from nba_api.stats.endpoints import leaguedashplayerstats
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

# -----------------------------
# CONFIG
# -----------------------------
CURRENT_SEASON = "2024-25"  # change each year
SLEEP_SECONDS = 1


print(f"Updating current season stats for {CURRENT_SEASON}...")

try:
    stats = leaguedashplayerstats.LeagueDashPlayerStats(
        season=CURRENT_SEASON,
        per_mode_detailed="PerGame"
    )

    df = stats.get_data_frames()[0]
    updated = 0

    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO players (id, full_name)
            VALUES (%s, %s)
            ON CONFLICT (id) DO NOTHING;
        """, (
            int(row["PLAYER_ID"]),
            row["PLAYER_NAME"]
        ))

        cur.execute("""
            INSERT INTO player_stats (
                player_id, season, team_name,
                games_played, minutes_per_game,
                points, rebounds, assists, steals, blocks, turnovers,
                field_goal_pct, three_point_pct, free_throw_pct
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (player_id, season, team_name)
            DO UPDATE SET
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
        """, (
            int(row["PLAYER_ID"]),
            CURRENT_SEASON,
            row["TEAM_ABBREVIATION"],
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
            float(row["FT_PCT"])
        ))

        updated += 1

    conn.commit()
    print(f"Updated {updated} players for {CURRENT_SEASON} ✅")

except Exception as e:
    conn.rollback()
    print(f"Current season update failed: {e}")

finally:
    cur.close()
    conn.close()
