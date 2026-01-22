import os
import numpy as np
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv()

from nba_api.stats.endpoints import (
    leaguedashplayerstats,
    leaguedashplayershotlocations,
    leaguedashplayerbiostats
)


player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
    season="2025-26",
    per_mode_detailed="PerGame"
)

df = player_stats.get_data_frames()[0]

base_features = [
    "PLAYER_ID",
    "PLAYER_NAME",
    "MIN",
    "PTS",
    "REB",
    "AST",
    "STL",
    "BLK",
    "FG3A"
]

df = df[base_features]
df = df[df["MIN"] > 10] # only include players with 10 MPG
df = df.drop(columns=["MIN"])

shot_chart = leaguedashplayershotlocations.LeagueDashPlayerShotLocations(
    season="2025-26",
    per_mode_detailed="PerGame"
)

shot_df = shot_chart.get_data_frames()[0]

shot_df = shot_df[
    [
        ("", "PLAYER_NAME"),
        ("Restricted Area", "FGA"),
        ("In The Paint (Non-RA)", "FGA"),
        ("Mid-Range", "FGA"),
    ]
]

shot_df.columns = [
    "PLAYER_NAME",
    "RA_FGA",
    "PAINT_FGA",
    "MID_FGA"
]

shot_df["PAINT_ATTEMPTS"] = shot_df["RA_FGA"] + shot_df["PAINT_FGA"]

df = df.merge(shot_df[["PLAYER_NAME", "PAINT_ATTEMPTS", "MID_FGA"]], on="PLAYER_NAME", how="inner")

bio_stats = leaguedashplayerbiostats.LeagueDashPlayerBioStats(
    season="2025-26",
    per_mode_simple="PerGame"
)

bio_df = bio_stats.get_data_frames()[0][
    ["PLAYER_NAME", "USG_PCT"]
]

df = df.merge(bio_df, on="PLAYER_NAME", how="inner")


POST_GRES_PASSWORD = os.getenv("POST_GRES_PASSWORD")

conn = psycopg2.connect(
    host="localhost",
    database="nba-dashboard",
    user="postgres",
    password=POST_GRES_PASSWORD
)
cur = conn.cursor()

season = "2025-26"

insert_player = """
INSERT INTO player_adv_stats (
    player_id,
    player_name,
    season,
    points,
    rebounds,
    assists,
    steals,
    blocks,
    threes_attempted,
    paint_pts_attempted,
    mid_fg_attempted,
    usage_pct
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (player_id, season)
DO UPDATE SET
    player_name = EXCLUDED.player_name,
    points = EXCLUDED.points,
    rebounds = EXCLUDED.rebounds,
    assists = EXCLUDED.assists,
    steals = EXCLUDED.steals,
    blocks = EXCLUDED.blocks,
    threes_attempted = EXCLUDED.threes_attempted,
    paint_pts_attempted = EXCLUDED.paint_pts_attempted,
    mid_fg_attempted = EXCLUDED.mid_fg_attempted,
    usage_pct = EXCLUDED.usage_pct;
"""

print(f"Processing players for {season}...")
inserted = 0

for _, row in df.iterrows():
    cur.execute(
        insert_player,
        (
            int(row["PLAYER_ID"]),
            row["PLAYER_NAME"],
            season,
            float(row["PTS"]),
            float(row["REB"]),
            float(row["AST"]),
            float(row["STL"]),
            float(row["BLK"]),
            float(row["FG3A"]),
            float(row["PAINT_ATTEMPTS"]),
            float(row["MID_FGA"]),
            float(row["USG_PCT"]),
        )
    )
    inserted += 1

conn.commit()

cur.close()
conn.close()

print(f"Inserted/Updated {inserted} player-season rows for {season}")
print("Players ingestion complete")
