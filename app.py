import os
import csv
import io
from datetime import datetime
from functools import wraps
from flask import (
    Flask, render_template, request, jsonify, session, 
    redirect, url_for, flash, Response, make_response
)
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_db, init_db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'typepulse-secret-key-modern-typing-2026')

# Initialize DB on start if needed
init_db()

# --- Decorators & Helpers ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            if request.is_json or request.path.startswith('/api/admin/'):
                return jsonify({'error': 'Unauthorized: Admin login required'}), 401
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def get_settings():
    db = get_db()
    rows = db.execute('SELECT key, value FROM settings').fetchall()
    db.close()
    return {row['key']: row['value'] for row in rows}

def calculate_stars(wpm, target_wpm, accuracy, min_accuracy):
    if accuracy < min_accuracy or wpm < target_wpm:
        return 0  # Failed
    if wpm >= target_wpm * 1.5 and accuracy >= min_accuracy + 5:
        return 3  # Gold 3 stars
    elif wpm >= target_wpm * 1.2 and accuracy >= min_accuracy + 2:
        return 2  # Silver 2 stars
    return 1      # Bronze 1 star (Passed)

# --- Frontend Template Routes ---
@app.route('/')
def index():
    student_name = session.get('student_name', 'Guest Typist')
    settings = get_settings()
    return render_template('index.html', student_name=student_name, settings=settings)

@app.route('/levels')
def levels_view():
    student_name = session.get('student_name', 'Guest Typist')
    settings = get_settings()
    return render_template('levels.html', student_name=student_name, settings=settings)

@app.route('/leaderboard')
def leaderboard_view():
    student_name = session.get('student_name', 'Guest Typist')
    settings = get_settings()
    return render_template('leaderboard.html', student_name=student_name, settings=settings)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))

    error = None
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        db = get_db()
        admin = db.execute('SELECT * FROM admin_users WHERE username = ?', (username,)).fetchone()
        db.close()

        if admin and check_password_hash(admin['password_hash'], password):
            session['admin_logged_in'] = True
            session['admin_username'] = admin['username']
            flash('Admin successfully logged in', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            error = 'Invalid admin username or password.'

    return render_template('admin_login.html', error=error)

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    flash('Logged out successfully.', 'info')
    return redirect(url_for('admin_login'))

@app.route('/admin')
@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    settings = get_settings()
    return render_template('admin_dashboard.html', settings=settings, admin_user=session.get('admin_username'))

# --- API Endpoints ---

@app.route('/api/session/student', methods=['GET', 'POST'])
def handle_student_session():
    db = get_db()
    if request.method == 'POST':
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        if not username:
            return jsonify({'error': 'Student username is required'}), 400

        # Check or create student
        student = db.execute('SELECT * FROM students WHERE username = ?', (username,)).fetchone()
        if not student:
            db.execute('''
            INSERT INTO students (username, display_name, highest_level_unlocked)
            VALUES (?, ?, 1)
            ''', (username, username))
            db.commit()
            student = db.execute('SELECT * FROM students WHERE username = ?', (username,)).fetchone()
        
        session['student_name'] = username
        db.close()
        return jsonify({
            'success': True,
            'student': {
                'username': student['username'],
                'highest_level_unlocked': student['highest_level_unlocked'],
                'best_wpm': student['best_wpm'],
                'average_accuracy': student['average_accuracy'],
                'total_tests': student['total_tests']
            }
        })
    else:
        # GET current student
        username = session.get('student_name', 'Guest Typist')
        student = db.execute('SELECT * FROM students WHERE username = ?', (username,)).fetchone()
        db.close()
        if student:
            student_data = {
                'username': student['username'],
                'highest_level_unlocked': student['highest_level_unlocked'],
                'best_wpm': student['best_wpm'],
                'average_accuracy': student['average_accuracy'],
                'total_tests': student['total_tests']
            }
        else:
            student_data = {
                'username': username,
                'highest_level_unlocked': 1,
                'best_wpm': 0,
                'average_accuracy': 0,
                'total_tests': 0
            }
        return jsonify({'student': student_data})

@app.route('/api/levels')
def get_levels():
    db = get_db()
    username = session.get('student_name', 'Guest Typist')
    settings = get_settings()
    enforce_lock = settings.get('enforce_level_lock', 'true') == 'true'

    student = db.execute('SELECT * FROM students WHERE username = ?', (username,)).fetchone()
    highest_unlocked = student['highest_level_unlocked'] if student else 1

    levels_rows = db.execute('SELECT * FROM levels WHERE is_active = 1 ORDER BY level_number ASC').fetchall()
    
    # Get student's best score and stars per level
    passed_levels = {}
    if username:
        scores = db.execute('''
        SELECT level_number, MAX(wpm) as max_wpm, MAX(stars) as max_stars, MAX(passed) as has_passed
        FROM test_results
        WHERE student_name = ?
        GROUP BY level_number
        ''', (username,)).fetchall()
        for s in scores:
            passed_levels[s['level_number']] = {
                'best_wpm': s['max_wpm'],
                'stars': s['max_stars'],
                'passed': bool(s['has_passed'])
            }

    levels = []
    for row in levels_rows:
        lvl_num = row['level_number']
        is_unlocked = True
        if enforce_lock:
            is_unlocked = (lvl_num <= highest_unlocked)

        stats = passed_levels.get(lvl_num, {'best_wpm': 0, 'stars': 0, 'passed': False})

        levels.append({
            'id': row['id'],
            'level_number': lvl_num,
            'title': row['title'],
            'category': row['category'],
            'description': row['description'],
            'content': row['content'],
            'target_wpm': row['target_wpm'],
            'min_accuracy': row['min_accuracy'],
            'time_limit': row['time_limit'],
            'unlocked': is_unlocked,
            'best_wpm': stats['best_wpm'],
            'stars': stats['stars'],
            'passed': stats['passed']
        })

    db.close()
    return jsonify({
        'levels': levels,
        'highest_unlocked': highest_unlocked,
        'enforce_lock': enforce_lock
    })

@app.route('/api/level/<int:level_number>')
def get_level(level_number):
    db = get_db()
    level = db.execute('SELECT * FROM levels WHERE level_number = ? AND is_active = 1', (level_number,)).fetchone()
    db.close()
    if not level:
        return jsonify({'error': 'Level not found'}), 404
    
    return jsonify({
        'level': {
            'id': level['id'],
            'level_number': level['level_number'],
            'title': level['title'],
            'category': level['category'],
            'description': level['description'],
            'content': level['content'],
            'target_wpm': level['target_wpm'],
            'min_accuracy': level['min_accuracy'],
            'time_limit': level['time_limit']
        }
    })

@app.route('/api/save-result', methods=['POST'])
def save_result():
    data = request.get_json() or {}
    student_name = session.get('student_name') or data.get('student_name') or 'Guest Typist'
    level_number = data.get('level_number')
    mode = data.get('mode', 'level')
    wpm = float(data.get('wpm', 0))
    raw_wpm = float(data.get('raw_wpm', wpm))
    accuracy = float(data.get('accuracy', 0))
    errors_count = int(data.get('errors_count', 0))
    time_seconds = float(data.get('time_seconds', 0))

    db = get_db()
    passed = 0
    stars = 0
    new_unlocked = False

    # If it's a level test, check criteria
    if mode == 'level' and level_number:
        level = db.execute('SELECT * FROM levels WHERE level_number = ?', (level_number,)).fetchone()
        if level:
            target_wpm = level['target_wpm']
            min_acc = level['min_accuracy']
            stars = calculate_stars(wpm, target_wpm, accuracy, min_acc)
            passed = 1 if stars > 0 else 0

            # If passed and matches student's current highest level, advance to next level!
            student = db.execute('SELECT * FROM students WHERE username = ?', (student_name,)).fetchone()
            if student:
                cur_unlocked = student['highest_level_unlocked']
                if passed and level_number == cur_unlocked:
                    next_level = level_number + 1
                    # Check if next level exists
                    has_next = db.execute('SELECT id FROM levels WHERE level_number = ?', (next_level,)).fetchone()
                    if has_next:
                        db.execute('UPDATE students SET highest_level_unlocked = ? WHERE username = ?', (next_level, student_name))
                        new_unlocked = True

    # Record test result
    cursor = db.cursor()
    cursor.execute('''
    INSERT INTO test_results 
    (student_name, level_number, mode, wpm, raw_wpm, accuracy, errors_count, time_seconds, passed, stars)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (student_name, level_number, mode, wpm, raw_wpm, accuracy, errors_count, time_seconds, passed, stars))

    # Update student aggregate stats
    student = db.execute('SELECT * FROM students WHERE username = ?', (student_name,)).fetchone()
    if student:
        total_tests = student['total_tests'] + 1
        best_wpm = max(student['best_wpm'], wpm)
        # Calculate new average accuracy
        new_avg_acc = ((student['average_accuracy'] * student['total_tests']) + accuracy) / total_tests
        db.execute('''
        UPDATE students 
        SET total_tests = ?, best_wpm = ?, average_accuracy = ?, last_active = CURRENT_TIMESTAMP
        WHERE username = ?
        ''', (total_tests, round(best_wpm, 1), round(new_avg_acc, 1), student_name))

    db.commit()
    db.close()

    return jsonify({
        'success': True,
        'passed': bool(passed),
        'stars': stars,
        'wpm': round(wpm, 1),
        'accuracy': round(accuracy, 1),
        'new_level_unlocked': new_unlocked
    })

@app.route('/api/leaderboard')
def get_leaderboard():
    level_filter = request.args.get('level', type=int)
    db = get_db()
    
    if level_filter:
        query = '''
        SELECT tr.id, tr.student_name, tr.level_number, tr.wpm, tr.accuracy, tr.stars, tr.created_at,
               l.title as level_title
        FROM test_results tr
        LEFT JOIN levels l ON tr.level_number = l.level_number
        WHERE tr.level_number = ? AND tr.mode = 'level'
        ORDER BY tr.wpm DESC, tr.accuracy DESC
        LIMIT 50
        '''
        results = db.execute(query, (level_filter,)).fetchall()
    else:
        # All-time top typists (best WPM per student)
        query = '''
        SELECT username as student_name, best_wpm as wpm, average_accuracy as accuracy,
               highest_level_unlocked, total_tests, last_active as created_at
        FROM students
        WHERE total_tests > 0
        ORDER BY best_wpm DESC, average_accuracy DESC
        LIMIT 50
        '''
        results = db.execute(query).fetchall()

    leaderboard = []
    for idx, row in enumerate(results, 1):
        leaderboard.append({
            'rank': idx,
            'student_name': row['student_name'],
            'wpm': round(row['wpm'], 1),
            'accuracy': round(row['accuracy'], 1),
            'level_number': row['level_number'] if 'level_number' in row.keys() else row.get('highest_level_unlocked', 1),
            'stars': row.get('stars', 3),
            'created_at': row['created_at']
        })

    db.close()
    return jsonify({'leaderboard': leaderboard})

@app.route('/api/random-quote')
def get_random_quote():
    quotes = [
        "Typing fast is not just about moving your fingers quickly, it is about staying calm and keeping your rhythm steady.",
        "The computer programmer is a creator of universes for which he alone is responsible. Universes of virtually unlimited complexity.",
        "Consistency is the true foundation of speed. Accuracy first, velocity follows naturally as muscle memory takes over.",
        "Every master was once a beginner. Every champion was once a contender who simply refused to give up on their goals.",
        "In modern software engineering, clear thinking and rapid keystrokes unite to turn creative visions into executable reality.",
        "Stay dedicated to daily deliberate practice. The tactile feedback of every keypress brings you closer to effortless flow.",
        "Do not fear mistakes or misstrokes; analyze them, adjust your hand posture, and glide smoothly through the next paragraph."
    ]
    import random
    return jsonify({'quote': random.choice(quotes)})

# --- Admin API Endpoints ---

@app.route('/api/admin/stats')
@admin_required
def admin_stats():
    db = get_db()
    total_tests = db.execute('SELECT COUNT(*) FROM test_results').fetchone()[0]
    total_students = db.execute('SELECT COUNT(*) FROM students').fetchone()[0]
    total_levels = db.execute('SELECT COUNT(*) FROM levels').fetchone()[0]
    
    avg_stats = db.execute('SELECT AVG(wpm), AVG(accuracy) FROM test_results').fetchone()
    avg_wpm = round(avg_stats[0] or 0, 1)
    avg_acc = round(avg_stats[1] or 0, 1)

    pass_stats = db.execute('SELECT COUNT(*) FROM test_results WHERE passed = 1').fetchone()[0]
    pass_rate = round((pass_stats / total_tests * 100) if total_tests > 0 else 0, 1)

    # Recent 10 tests
    recent_tests = db.execute('''
    SELECT tr.*, l.title as level_title 
    FROM test_results tr
    LEFT JOIN levels l ON tr.level_number = l.level_number
    ORDER BY tr.created_at DESC LIMIT 10
    ''').fetchall()

    recent_list = []
    for r in recent_tests:
        recent_list.append({
            'id': r['id'],
            'student_name': r['student_name'],
            'level_number': r['level_number'],
            'level_title': r['level_title'] or f"Level {r['level_number']}",
            'wpm': round(r['wpm'], 1),
            'accuracy': round(r['accuracy'], 1),
            'passed': bool(r['passed']),
            'stars': r['stars'],
            'created_at': r['created_at']
        })

    db.close()
    return jsonify({
        'total_tests': total_tests,
        'total_students': total_students,
        'total_levels': total_levels,
        'avg_wpm': avg_wpm,
        'avg_accuracy': avg_acc,
        'pass_rate': pass_rate,
        'recent_tests': recent_list
    })

@app.route('/api/admin/levels', methods=['GET'])
@admin_required
def admin_get_levels():
    db = get_db()
    levels = db.execute('SELECT * FROM levels ORDER BY level_number ASC').fetchall()
    db.close()
    return jsonify({
        'levels': [dict(lvl) for lvl in levels]
    })

@app.route('/api/admin/level/create', methods=['POST'])
@admin_required
def admin_create_level():
    data = request.get_json() or {}
    level_number = data.get('level_number')
    title = data.get('title', '').strip()
    category = data.get('category', 'General').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    target_wpm = int(data.get('target_wpm', 20))
    min_accuracy = int(data.get('min_accuracy', 85))
    time_limit = int(data.get('time_limit', 0))

    if not title or not content:
        return jsonify({'error': 'Title and Practice Content are required'}), 400

    db = get_db()
    if not level_number:
        # Auto pick next number
        max_num = db.execute('SELECT MAX(level_number) FROM levels').fetchone()[0] or 0
        level_number = max_num + 1

    try:
        db.execute('''
        INSERT INTO levels (level_number, title, category, description, content, target_wpm, min_accuracy, time_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (level_number, title, category, description, content, target_wpm, min_accuracy, time_limit))
        db.commit()
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({'error': f'Level number {level_number} already exists!'}), 400

    db.close()
    return jsonify({'success': True, 'message': 'Level created successfully!'})

@app.route('/api/admin/level/update/<int:level_id>', methods=['POST'])
@admin_required
def admin_update_level(level_id):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()
    content = data.get('content', '').strip()
    target_wpm = int(data.get('target_wpm', 20))
    min_accuracy = int(data.get('min_accuracy', 85))
    time_limit = int(data.get('time_limit', 0))
    level_number = int(data.get('level_number', 1))

    if not title or not content:
        return jsonify({'error': 'Title and Practice Content are required'}), 400

    db = get_db()
    db.execute('''
    UPDATE levels
    SET level_number = ?, title = ?, category = ?, description = ?, content = ?, target_wpm = ?, min_accuracy = ?, time_limit = ?
    WHERE id = ?
    ''', (level_number, title, category, description, content, target_wpm, min_accuracy, time_limit, level_id))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Level updated successfully!'})

@app.route('/api/admin/level/delete/<int:level_id>', methods=['POST'])
@admin_required
def admin_delete_level(level_id):
    db = get_db()
    db.execute('DELETE FROM levels WHERE id = ?', (level_id,))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Level deleted successfully!'})

@app.route('/api/admin/results', methods=['GET'])
@admin_required
def admin_get_results():
    search = request.args.get('search', '').strip()
    db = get_db()
    
    if search:
        query = '''
        SELECT tr.*, l.title as level_title
        FROM test_results tr
        LEFT JOIN levels l ON tr.level_number = l.level_number
        WHERE tr.student_name LIKE ?
        ORDER BY tr.created_at DESC
        LIMIT 100
        '''
        results = db.execute(query, (f"%{search}%",)).fetchall()
    else:
        query = '''
        SELECT tr.*, l.title as level_title
        FROM test_results tr
        LEFT JOIN levels l ON tr.level_number = l.level_number
        ORDER BY tr.created_at DESC
        LIMIT 100
        '''
        results = db.execute(query).fetchall()

    db.close()
    return jsonify({
        'results': [dict(r) for r in results]
    })

@app.route('/api/admin/result/delete/<int:result_id>', methods=['POST'])
@admin_required
def admin_delete_result(result_id):
    db = get_db()
    db.execute('DELETE FROM test_results WHERE id = ?', (result_id,))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Record deleted successfully!'})

@app.route('/api/admin/settings/update', methods=['POST'])
@admin_required
def admin_update_settings():
    data = request.get_json() or {}
    db = get_db()
    for key in ['site_name', 'enforce_level_lock', 'allow_guest_tests', 'announcement']:
        if key in data:
            db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, str(data[key])))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Settings updated successfully!'})

@app.route('/api/admin/password/change', methods=['POST'])
@admin_required
def admin_change_password():
    data = request.get_json() or {}
    old_password = data.get('old_password', '').strip()
    new_password = data.get('new_password', '').strip()

    if not old_password or not new_password:
        return jsonify({'error': 'Old and new passwords are required'}), 400
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    admin_username = session.get('admin_username')
    db = get_db()
    admin = db.execute('SELECT * FROM admin_users WHERE username = ?', (admin_username,)).fetchone()

    if not admin or not check_password_hash(admin['password_hash'], old_password):
        db.close()
        return jsonify({'error': 'Current password does not match'}), 400

    new_hash = generate_password_hash(new_password)
    db.execute('UPDATE admin_users SET password_hash = ? WHERE username = ?', (new_hash, admin_username))
    db.commit()
    db.close()
    return jsonify({'success': True, 'message': 'Password changed successfully!'})

@app.route('/api/admin/export-csv')
@admin_required
def admin_export_csv():
    db = get_db()
    results = db.execute('''
    SELECT tr.id, tr.student_name, tr.level_number, l.title as level_title,
           tr.wpm, tr.raw_wpm, tr.accuracy, tr.errors_count, tr.time_seconds,
           tr.passed, tr.stars, tr.created_at
    FROM test_results tr
    LEFT JOIN levels l ON tr.level_number = l.level_number
    ORDER BY tr.created_at DESC
    ''').fetchall()
    db.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Student Name', 'Level', 'Level Title', 'WPM', 'Raw WPM', 'Accuracy %', 'Errors', 'Duration (s)', 'Passed', 'Stars', 'Date'])

    for row in results:
        writer.writerow([
            row['id'],
            row['student_name'],
            row['level_number'],
            row['level_title'] or f"Level {row['level_number']}",
            round(row['wpm'], 1),
            round(row['raw_wpm'], 1),
            round(row['accuracy'], 1),
            row['errors_count'],
            round(row['time_seconds'], 1),
            'YES' if row['passed'] else 'NO',
            row['stars'],
            row['created_at']
        ])

    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename=typing_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting TypePulse Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
