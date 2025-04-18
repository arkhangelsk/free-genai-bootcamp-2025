from flask import Flask
from routes.study_activities import study_activities_bp
from routes.study_sessions import study_sessions_bp
from routes.words import words_bp
from routes.groups import groups_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}) # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(study_activities_bp, url_prefix="/api")
app.register_blueprint(words_bp, url_prefix="/api")
app.register_blueprint(groups_bp, url_prefix="/api")
app.register_blueprint(study_sessions_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
