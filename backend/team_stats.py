from nba_api.stats.endpoints import leaguedashteamstats, leaguestandings
import psycopg2
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv() 
POST_GRES_PASSWORD = os.getenv("POST_GRES_PASSWORD")

# Connect to PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    database="nba-dashboard",
    user="postgres",
    password=POST_GRES_PASSWORD
)
cur = conn.cursor()

# Load valid teams from database
cur.execute("SELECT full_name FROM teams;")
valid_teams = {row[0] for row in cur.fetchall()}
print(f"Loaded {len(valid_teams)} valid NBA teams from database")

# Handle team name discrepancies
TEAM_NAME_MAP = {
    "LA Clippers": "Los Angeles Clippers",
    "LA Lakers": "Los Angeles Lakers",
}

# Seasons to ingest
seasons = [
    "2014-15", "2015-16", "2016-17", "2017-18", "2018-19", "2019-20",
    "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"
]

# Insert/update query
insert_query = """
INSERT INTO team_stats (
    team_name, season,
    wins, losses,
    points, rebounds, assists,
    steals, blocks, turnovers,
    field_goal_pct, three_point_pct, free_throw_pct
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (team_name, season) DO UPDATE SET
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
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
    print(f"\nProcessing season {season}...")

    try:
        # Fetch official standings for accurate win-loss
        standings_df = leaguestandings.LeagueStandings(season=season).get_data_frames()[0]

        # Determine correct column names for wins/losses
        wins_col = "W" if "W" in standings_df.columns else "WINS"
        losses_col = "L" if "L" in standings_df.columns else "LOSSES"

        # Build dict of team W/L totals as numbers
        team_wl = {}
        for _, row in standings_df.iterrows():
            raw_name = row["TeamName"]
            team_name = TEAM_NAME_MAP.get(raw_name, raw_name)
            team_wl[team_name] = (
                int(row[wins_col]),    # wins
                int(row[losses_col])   # losses
            )

        # Fetch per-game stats
        stats_df = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            per_mode_detailed="PerGame"
        ).get_data_frames()[0]

        inserted, skipped = 0, 0

        # Insert/update each team
        for _, row in stats_df.iterrows():
            raw_name = row["TEAM_NAME"]
            team_name = TEAM_NAME_MAP.get(raw_name, raw_name)

            if team_name not in valid_teams:
                skipped += 1
                print(f"Skipped unknown team {team_name} for season {season}")
                continue

            if team_name not in team_wl:
                skipped += 1
                print(f"Skipped {team_name} — missing W/L for season {season}")
                continue

            wins, losses = team_wl[team_name]

            cur.execute(
                insert_query,
                (
                    team_name,
                    season,
                    wins,
                    losses,
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
        print(f"Inserted/Updated {inserted} teams | Skipped {skipped}")

        time.sleep(1)

    except Exception as e:
        conn.rollback()
        print(f"Failed for season {season}: {e}")

cur.close()
conn.close()
print("\nTeam stats ingestion complete")
