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
    activity_type = request.args.get("activity_type")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    # Build the query dynamically based on provided filters
    query = """
        SELECT ss.id,
               ss.group_id,
               ss.study_activity_id,
               ss.start_time,
               ss.end_time,
               ss.active_time_seconds,
               g.name as group_name, 
               sa.name as activity_name, 
               sa.type as activity_type
        FROM study_sessions ss
        JOIN groups g ON ss.group_id = g.id
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        WHERE 1=1
    """
    params = []

    if group_id:
        query += " AND ss.group_id = ?"
        params.append(group_id)

    if study_activity_id:
        query += " AND ss.study_activity_id = ?"
        params.append(study_activity_id)

    if activity_type:
        query += " AND sa.type = ?"
        params.append(activity_type)

    if date_from:
        query += " AND ss.start_time >= ?"
        params.append(date_from)

    if date_to:
        query += " AND ss.start_time <= ?"
        params.append(date_to)

    # Add ordering to get most recent first
    query += " ORDER BY ss.start_time DESC"

    cursor.execute(query, params)
    sessions = cursor.fetchall()

    db.close()
    return jsonify([dict(session) for session in sessions])


@study_sessions_bp.route("/study-sessions/<int:session_id>", methods=["GET", "OPTIONS"])
def get_study_session(session_id):
    """Retrieve a specific study session by ID with detailed information."""
    db = get_db()
    cursor = db.cursor()

    # Get comprehensive session data with joins
    query = """
        SELECT ss.*,
               g.name as group_name,
               sa.name as activity_name,
               sa.type as activity_type,
               sa.difficulty as activity_difficulty
        FROM study_sessions ss
        JOIN groups g ON ss.group_id = g.id
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        WHERE ss.id = ?
    """

    session = cursor.execute(query, (session_id,)).fetchone()

    if not session:
        db.close()
        return jsonify({"error": "Study session not found"}), 404

    # For quiz and game type activities, get the performance data if available
    session_dict = dict(session)

    if session["activity_type"] in ["quiz", "game"]:
        # Get performance data
        performance_query = """
            SELECT 
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
            FROM session_responses
            WHERE session_id = ?
        """
        performance = cursor.execute(performance_query, (session_id,)).fetchone()

        if performance and performance["total_questions"] > 0:
            correct = performance["correct_answers"] or 0
            total = performance["total_questions"] or 1  # Avoid division by zero
            score = round((correct / total) * 100)
            session_dict["score"] = score
            session_dict["total_questions"] = total
            session_dict["correct_answers"] = correct

    db.close()
    return jsonify(session_dict), 200


@study_sessions_bp.route("/study-sessions/<int:session_id>/responses", methods=["GET"])
def get_session_responses(session_id):
    """Get all responses for a specific session"""
    db = get_db()
    cursor = db.cursor()

    # Verify session exists
    session = cursor.execute(
        "SELECT id FROM study_sessions WHERE id = ?", (session_id,)
    ).fetchone()

    if not session:
        db.close()
        return jsonify({"error": "Session not found"}), 404

    # Get all responses with question details
    responses = cursor.execute(
        """
        SELECT 
            sr.id as id,
            sr.question_id,
            sr.user_response,
            sr.is_correct,
            sr.created_at,
            w.english,
            w.arabic,
            w.romanized
        FROM session_responses sr
        LEFT JOIN words w ON sr.question_id = w.id
        WHERE sr.session_id = ?
        ORDER BY sr.created_at
    """,
        (session_id,),
    ).fetchall()

    db.close()
    return jsonify([dict(r) for r in responses]), 200


@study_sessions_bp.route("/study-sessions/latest", methods=["GET"])
def get_latest_study_session():
    """Fetch details of the latest study session."""
    db = get_db()
    cursor = db.cursor()

    latest_session = cursor.execute(
        """
        SELECT ss.id, g.name AS group_name, sa.name AS activity_name,
               sa.type AS activity_type, ss.start_time, ss.end_time 
        FROM study_sessions ss
        JOIN groups g ON ss.group_id = g.id
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        ORDER BY ss.start_time DESC 
        LIMIT 1
        """
    ).fetchone()

    db.close()

    if latest_session:
        return jsonify(dict(latest_session)), 200
    else:
        return jsonify({"error": "No study sessions found"}), 404


@study_sessions_bp.route("/study-sessions/stats", methods=["GET"])
def get_session_stats():
    """Get aggregated statistics about study sessions."""
    db = get_db()
    cursor = db.cursor()

    # Get time range filter if provided
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    params = []
    date_condition = "1=1"

    if date_from:
        date_condition += " AND ss.start_time >= ?"
        params.append(date_from)

    if date_to:
        date_condition += " AND ss.start_time <= ?"
        params.append(date_to)

    # Total sessions and completion stats
    completion_stats = cursor.execute(
        f"""
        SELECT
            COUNT(*) as total_sessions,
            SUM(CASE WHEN end_time IS NOT NULL THEN 1 ELSE 0 END) as completed_sessions,
            SUM(
                CASE WHEN end_time IS NOT NULL 
                THEN CAST((julianday(end_time) - julianday(start_time)) * 24 * 60 AS INTEGER)
                ELSE 0 END
            ) as total_minutes
        FROM study_sessions ss
        WHERE {date_condition}
        """,
        params,
    ).fetchone()

    # Sessions by activity type
    type_params = params.copy()
    activity_types = cursor.execute(
        f"""
        SELECT
            sa.type as activity_type,
            COUNT(*) as session_count
        FROM study_sessions ss
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        WHERE {date_condition}
        GROUP BY sa.type
        ORDER BY session_count DESC
        """,
        type_params,
    ).fetchall()

    # Get average scores for quiz/game activities
    score_params = params.copy()
    scores = cursor.execute(
        f"""
        SELECT
            sa.type as activity_type,
            AVG(
                CASE WHEN sr.total_questions > 0 
                THEN (sr.correct_answers * 100.0 / sr.total_questions)
                ELSE 0 END
            ) as average_score
        FROM study_sessions ss
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        LEFT JOIN (
            SELECT 
                session_id,
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
            FROM session_responses
            GROUP BY session_id
        ) sr ON ss.id = sr.session_id
        WHERE {date_condition} AND sa.type IN ('quiz', 'game')
        GROUP BY sa.type
        """,
        score_params,
    ).fetchall()

    # Track daily activity
    daily_params = params.copy()
    daily_activity = cursor.execute(
        f"""
        SELECT
            date(ss.start_time) as study_date,
            COUNT(*) as session_count,
            SUM(
                CASE WHEN end_time IS NOT NULL 
                THEN CAST((julianday(end_time) - julianday(start_time)) * 24 * 60 AS INTEGER)
                ELSE 0 END
            ) as minutes_studied
        FROM study_sessions ss
        WHERE {date_condition}
        GROUP BY date(ss.start_time)
        ORDER BY study_date DESC
        LIMIT 30
        """,
        daily_params,
    ).fetchall()

    db.close()

    stats = {
        "total_sessions": completion_stats["total_sessions"],
        "completed_sessions": completion_stats["completed_sessions"],
        "total_minutes": completion_stats["total_minutes"],
        "activity_types": [dict(t) for t in activity_types],
        "average_scores": [dict(s) for s in scores],
        "daily_activity": [dict(d) for d in daily_activity],
    }

    return jsonify(stats), 200


@study_sessions_bp.route("/study-sessions", methods=["POST"])
def start_study_session():
    """Start a new study session."""
    try:
        db = get_db()
        cursor = db.cursor()

        data = request.get_json()
        print(f"Received data: {data}")

        group_id = data.get("group_id")
        study_activity_id = data.get("study_activity_id")

        if not group_id or not study_activity_id:
            return jsonify({"error": "group_id and study_activity_id are required"}), 400

        # Verify the group exists
        group = cursor.execute("SELECT * FROM groups WHERE id = ?", (group_id,)).fetchone()
        if not group:
            return jsonify({"error": f"Group with id {group_id} not found"}), 404

        # Verify the study activity exists
        activity = cursor.execute("SELECT * FROM study_activities WHERE id = ?", (study_activity_id,)).fetchone()
        if not activity:
            return jsonify({"error": f"Study activity with id {study_activity_id} not found"}), 404

        # Insert new study session (end_time remains NULL initially)
        cursor.execute(
            """
            INSERT INTO study_sessions (group_id, study_activity_id, start_time)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            """,
            (group_id, study_activity_id),
        )

        db.commit()

        # Fetch the newly created session with additional info
        session_id = cursor.lastrowid
        session = cursor.execute(
            """
            SELECT ss.*, g.name as group_name, sa.name as activity_name, sa.type as activity_type
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            JOIN study_activities sa ON ss.study_activity_id = sa.id
            WHERE ss.id = ?
            """,
            (session_id,),
        ).fetchone()

        if not session:
            return jsonify({"error": "Failed to create session"}), 500

        db.close()
        return jsonify(dict(session)), 201  # 201 Created

    except Exception as e:
        print(f"Error in start_study_session: {str(e)}")
        if 'db' in locals():
            db.close()
        return jsonify({"error": str(e)}), 500


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

    # Get optional performance data if provided
    data = request.get_json() or {}

    # If this was a quiz or game, save the performance data first
    if data.get("responses"):
        for response in data["responses"]:
            cursor.execute(
                """
                INSERT INTO session_responses 
                (session_id, question_id, user_response, is_correct, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    response["question_id"],
                    response["user_response"],
                    1 if response["is_correct"] else 0,
                    response["timestamp"],
                ),
            )

    # Now get all responses including the ones we just inserted
    responses = cursor.execute(
        """
        SELECT created_at
        FROM session_responses
        WHERE session_id = ?
        ORDER BY created_at
        """,
        (session_id,)
    ).fetchall()

    # Calculate total active time
    active_time = 0
    if responses:
        # Get session start time
        session_start = cursor.execute(
            "SELECT start_time FROM study_sessions WHERE id = ?",
            (session_id,)
        ).fetchone()[0]

        print(f"Session {session_id} start time: {session_start}")
        print(f"Found {len(responses)} responses")

        # Add time from session start to first response
        first_response_time = responses[0]['created_at']
        start_to_first = int((cursor.execute(
            "SELECT CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)",
            (first_response_time, session_start)
        ).fetchone() or (0,))[0])
        active_time += start_to_first
        print(f"Time from start to first response: {start_to_first} seconds")

        # Add time between responses
        for i in range(1, len(responses)):
            prev_time = responses[i-1]['created_at']
            curr_time = responses[i]['created_at']
            time_diff = int((cursor.execute(
                "SELECT CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)",
                (curr_time, prev_time)
            ).fetchone() or (0,))[0])
            active_time += time_diff
            print(f"Time between responses {i-1} and {i}: {time_diff} seconds")

    print(f"Total active time for session {session_id}: {active_time} seconds")

    # Update session with end time and active time
    cursor.execute(
        """
        UPDATE study_sessions 
        SET end_time = CURRENT_TIMESTAMP,
            active_time_seconds = ?
        WHERE id = ?
        """,
        (active_time, session_id)
    )
    
    # Make sure to commit the changes
    db.commit()

    db.commit()

    # Fetch updated session with additional data
    updated_session = cursor.execute(
        """
        SELECT ss.*, g.name as group_name, sa.name as activity_name, sa.type as activity_type
        FROM study_sessions ss
        JOIN groups g ON ss.group_id = g.id
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        WHERE ss.id = ?
        """,
        (session_id,),
    ).fetchone()

    session_dict = dict(updated_session)

    # Add performance data if this was a quiz or game
    if updated_session["activity_type"] in ["quiz", "game"]:
        performance = cursor.execute(
            """
            SELECT 
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
            FROM session_responses
            WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()

        if performance and performance["total_questions"] > 0:
            correct = performance["correct_answers"] or 0
            total = performance["total_questions"] or 1
            score = round((correct / total) * 100)
            session_dict["score"] = score
            session_dict["total_questions"] = total
            session_dict["correct_answers"] = correct

    db.close()

    return jsonify(session_dict), 200


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

    # Delete related session responses first (foreign key constraint)
    cursor.execute("DELETE FROM session_responses WHERE session_id = ?", (session_id,))

    # Now delete the session
    cursor.execute("DELETE FROM study_sessions WHERE id = ?", (session_id,))
    db.commit()
    db.close()

    return jsonify({"message": f"Study session {session_id} deleted successfully"}), 200


@study_sessions_bp.route("/study-sessions/reset", methods=["POST"])
def reset_study_sessions():
    """Reset all study sessions and related data."""
    try:
        db = get_db()
        cursor = db.cursor()

        # Delete all session responses first (due to foreign key constraints)
        cursor.execute("DELETE FROM session_responses")

        # Delete all study sessions
        cursor.execute("DELETE FROM study_sessions")

        db.commit()
        db.close()

        return jsonify({"message": "Successfully reset all study sessions"}), 200

    except Exception as e:
        print(f"Error in reset_study_sessions: {str(e)}")
        if 'db' in locals():
            db.close()
        return jsonify({"error": str(e)}), 500

@study_sessions_bp.route("/study-sessions/<int:session_id>/resume", methods=["POST"])
def resume_study_session(session_id):
    """Resume an existing study session"""
    db = get_db()
    cursor = db.cursor()

    # Verify session exists and is incomplete
    session = cursor.execute(
        """
        SELECT ss.*, sa.type as activity_type
        FROM study_sessions ss
        JOIN study_activities sa ON ss.study_activity_id = sa.id
        WHERE ss.id = ? AND ss.end_time IS NULL
        """,
        (session_id,),
    ).fetchone()

    if not session:
        db.close()
        return jsonify({"error": "Session not found or already completed"}), 404

    # Calculate active time for resuming session
    responses = cursor.execute(
        """
        SELECT created_at, is_correct
        FROM session_responses
        WHERE session_id = ?
        ORDER BY created_at
        """,
        (session_id,)
    ).fetchall()

    active_time = 0
    if responses:
        # Get session start time
        session_start = cursor.execute(
            "SELECT start_time FROM study_sessions WHERE id = ?",
            (session_id,)
        ).fetchone()[0]

        # Add time from session start to first response
        first_response_time = responses[0]['created_at']
        active_time += int((cursor.execute(
            "SELECT CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)",
            (first_response_time, session_start)
        ).fetchone() or (0,))[0])

        # Add time between responses
        for i in range(1, len(responses)):
            prev_time = responses[i-1]['created_at']
            curr_time = responses[i]['created_at']
            time_diff = int((cursor.execute(
                "SELECT CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER)",
                (curr_time, prev_time)
            ).fetchone() or (0,))[0])
            active_time += time_diff

    print(f"Calculated active time for resumed session {session_id}: {active_time} seconds")

    # Update session with active time
    cursor.execute(
        """
        UPDATE study_sessions 
        SET active_time_seconds = ?
        WHERE id = ?
        """,
        (active_time, session_id)
    )
    db.commit()

    # Return session details along with activity type
    session_dict = dict(session)

    # For quiz/game activities, get previous responses if any
    if session["activity_type"] in ["quiz", "game"]:
        responses = cursor.execute(
            """
            SELECT question_id, user_response, is_correct, created_at
            FROM session_responses
            WHERE session_id = ?
            ORDER BY created_at
            """,
            (session_id,),
        ).fetchall()
        session_dict["previous_responses"] = [dict(r) for r in responses]

    db.close()
    return jsonify(session_dict), 200
