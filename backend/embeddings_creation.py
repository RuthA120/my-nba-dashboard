import os
import numpy as np
import pandas as pd
import psycopg2
from sklearn.preprocessing import StandardScaler
from dotenv import load_dotenv

load_dotenv()

POSTGRES_PASSWORD = os.getenv("POST_GRES_PASSWORD")

# --- Connect to DB ---
conn = psycopg2.connect(
    host="localhost",
    database="nba-dashboard",
    user="postgres",
    password=POSTGRES_PASSWORD
)
cur = conn.cursor()

season = "2025-26"

# --- Step 1: Pull league-wide advanced stats ---
cur.execute("""
    SELECT player_id, points, rebounds, assists, steals, blocks,
           threes_attempted, paint_pts_attempted, mid_fg_attempted, usage_pct
    FROM player_adv_stats
    WHERE season = %s
    
""", (season,))

rows = cur.fetchall()
columns = [
    "player_id", "points", "rebounds", "assists", "steals", "blocks",
    "threes_attempted", "paint_pts_attempted", "mid_fg_attempted", "usage_pct"
]

df = pd.DataFrame(rows, columns=columns)

# --- Step 2: Standardize league-wide features ---
features = [
    "points", "rebounds", "assists", "steals", "blocks",
    "threes_attempted", "paint_pts_attempted", "mid_fg_attempted", "usage_pct"
]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[features])

df["embedding"] = X_scaled.tolist()

cur.execute("""
CREATE TABLE IF NOT EXISTS player_embeddings (
    player_id INT PRIMARY KEY,
    season TEXT,
    embedding FLOAT8[]
)
""")
conn.commit()

insert_sql = """
INSERT INTO player_embeddings (player_id, season, embedding)
VALUES (%s, %s, %s)
ON CONFLICT (player_id) DO UPDATE SET
    season = EXCLUDED.season,
    embedding = EXCLUDED.embedding
"""

for _, row in df.iterrows():
    cur.execute(insert_sql, (int(row["player_id"]), season, row["embedding"]))

conn.commit()
cur.close()
conn.close()

print(f"Embeddings generated and stored for {len(df)} players in season {season}.")
