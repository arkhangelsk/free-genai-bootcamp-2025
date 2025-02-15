from flask import Blueprint, jsonify, request
from db.lib.db import get_db

study_sessions_bp = Blueprint("study_sessions", __name__)

@study_sessions_bp.route("/study-sessions", methods=["GET"])
def get_all_study_sessions():
    """Retrieve all study sessions with optional filters."""
    db = get_db()
    cursor = db.cursor()

    # Get optional query parameters
    group_id = request.args.get("group_id")
    study_activity_id = request.args.get("study_activity_id")

    # Build the query dynamically based on provided filters
    query = "SELECT * FROM study_sessions WHERE 1=1"
    params = []

    if group_id:
        query += " AND group_id = ?"
        params.append(group_id)

    if study_activity_id:
        query += " AND study_activity_id = ?"
        params.append(study_activity_id)

    cursor.execute(query, params)
    sessions = cursor.fetchall()

    db.close()
    return jsonify([dict(session) for session in sessions])


@study_sessions_bp.route("/study-sessions/<int:session_id>", methods=["GET"])
def get_study_session(session_id):
    """Retrieve a specific study session by ID."""
    db = get_db()
    cursor = db.cursor()

    session = cursor.execute(
        "SELECT * FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    db.close()

    if session:
        return jsonify(dict(session)), 200  # 200 OK
    else:
        return jsonify({"error": "Study session not found"}), 404  # 404 Not Found

@study_sessions_bp.route("/study-sessions/latest", methods=["GET"])
def get_latest_study_session():
    """Fetch details of the latest study session."""
    db = get_db()
    cursor = db.cursor()

    latest_session = cursor.execute(
        """
        SELECT s.id, g.name AS group_name, s.start_time, s.end_time 
        FROM study_sessions s
        JOIN groups g ON s.group_id = g.id
        ORDER BY s.start_time DESC 
        LIMIT 1
        """
    ).fetchone()

    db.close()

    if latest_session:
        return jsonify(dict(latest_session)), 200
    else:
        return jsonify({"error": "No study sessions found"}), 404

@study_sessions_bp.route("/study-sessions", methods=["POST"])
def start_study_session():
    """Start a new study session."""
    db = get_db()
    cursor = db.cursor()

    data = request.get_json()

    group_id = data.get("group_id")
    study_activity_id = data.get("study_activity_id")

    if not group_id or not study_activity_id:
        return jsonify({"error": "group_id and study_activity_id are required"}), 400

    # Insert new study session (end_time remains NULL initially)
    cursor.execute(
        """
        INSERT INTO study_sessions (group_id, study_activity_id, start_time)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        """,
        (group_id, study_activity_id),
    )

    db.commit()

    # Fetch the newly created session
    session_id = cursor.lastrowid
    session = cursor.execute(
        "SELECT * FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()

    db.close()

    return jsonify(dict(session)), 201  # 201 Created


@study_sessions_bp.route("/study-sessions/<int:session_id>", methods=["PATCH"])
def complete_study_session(session_id):
    """Mark a study session as completed by updating the end_time."""
    db = get_db()
    cursor = db.cursor()

    # Check if session exists
    session = cursor.execute(
        "SELECT * FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if not session:
        db.close()
        return jsonify({"error": "Study session not found"}), 404

    # Update end_time to current timestamp
    cursor.execute(
        """
        UPDATE study_sessions
        SET end_time = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (session_id,),
    )

    db.commit()

    # Fetch updated session
    updated_session = cursor.execute(
        "SELECT * FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    db.close()

    return jsonify(dict(updated_session)), 200  # 200 OK


@study_sessions_bp.route("/study-sessions/<int:session_id>", methods=["DELETE"])
def delete_study_session(session_id):
    """Delete a study session by ID."""
    db = get_db()
    cursor = db.cursor()

    session = cursor.execute(
        "SELECT * FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()
    if not session:
        db.close()
        return jsonify({"error": "Study session not found"}), 404

    cursor.execute("DELETE FROM study_sessions WHERE id = ?", (session_id,))
    db.commit()
    db.close()

    return jsonify({"message": f"Study session {session_id} deleted successfully"}), 200
