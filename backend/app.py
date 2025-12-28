from flask import Flask
from flask_cors import CORS

from routes.players import players_bp
from routes.teams import teams_bp
from routes.roty_prediction import roty_bp
from routes.auth import auth_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(players_bp, url_prefix="/api/players")
app.register_blueprint(teams_bp, url_prefix="/api/teams")
app.register_blueprint(roty_bp, url_prefix="/api/roty")
app.register_blueprint(auth_bp)


if __name__ == "__main__":
    app.run(debug=True)
