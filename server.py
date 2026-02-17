from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__, static_folder='.')
CORS(app)

DB_FILE = 'workforce_scheduler.db'

# Database initialization
def init_db():
    """Initialize the SQLite database with tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Workers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT,
            skills TEXT,
            phone_number TEXT,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Chiefs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chiefs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Availability periods table (day-based)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS availability_periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            worker_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
        )
    ''')
    
    # Proposed tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS proposed_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chief_id INTEGER NOT NULL,
            chief_name TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            required_skills TEXT,
            required_department TEXT,
            priority TEXT DEFAULT 'medium',
            estimated_days INTEGER DEFAULT 1,
            start_date TEXT,
            end_date TEXT,
            status TEXT DEFAULT 'pending',
            matched_worker_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chief_id) REFERENCES chiefs(id),
            FOREIGN KEY (matched_worker_id) REFERENCES workers(id)
        )
    ''')
    
    # Task assignments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            worker_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            match_score REAL,
            status TEXT DEFAULT 'assigned',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES proposed_tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()    
    conn.close()
    print("✅ Database initialized successfully")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Server is running'})

# Workers endpoints
@app.route('/api/workers', methods=['GET'])
def get_workers():
    """Get all workers"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM workers ORDER BY created_at DESC')
    workers = [dict(row) for row in cursor.fetchall()]
    
    # Parse skills JSON string to array
    for worker in workers:
        worker['skills'] = worker['skills'].split(',') if worker['skills'] else []
    
    conn.close()
    return jsonify(workers)

@app.route('/api/workers', methods=['POST'])
def create_worker():
    """Create a new worker"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    skills_str = ','.join(data.get('skills', []))
    cursor.execute('''
        INSERT INTO workers (name, department, skills, phone_number, email)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['name'], data.get('department', ''), skills_str, data.get('phoneNumber'), data.get('email', '')))
    
    worker_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': worker_id, 'message': 'Worker created successfully'}), 201

@app.route('/api/workers/<int:worker_id>', methods=['DELETE'])
def delete_worker(worker_id):
    """Delete a worker"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Delete associated availability slots first
    cursor.execute('DELETE FROM availability_periods WHERE worker_id = ?', (worker_id,))
    cursor.execute('DELETE FROM workers WHERE id = ?', (worker_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Worker deleted successfully'})

# Chiefs endpoints
@app.route('/api/chiefs', methods=['GET'])
def get_chiefs():
    """Get all chiefs"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chiefs ORDER BY created_at DESC')
    chiefs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(chiefs)

@app.route('/api/chiefs', methods=['POST'])
def create_chief():
    """Create a new chief"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO chiefs (name, department, email)
        VALUES (?, ?, ?)
    ''', (data['name'], data.get('department', ''), data.get('email', '')))
    
    chief_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': chief_id, 'message': 'Chief created successfully'}), 201

@app.route('/api/chiefs/<int:chief_id>', methods=['DELETE'])
def delete_chief(chief_id):
    """Delete a chief"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM chiefs WHERE id = ?', (chief_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Chief deleted successfully'})

# Availability periods endpoints
@app.route('/api/availability', methods=['GET'])
def get_availability():
    """Get all availability periods"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM availability_periods ORDER BY start_date')
    periods = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(periods)

@app.route('/api/availability', methods=['POST'])
def create_availability():
    """Create availability period"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO availability_periods (worker_id, start_date, end_date)
        VALUES (?, ?, ?)
    ''', (data['workerId'], data['startDate'], data['endDate']))
    
    period_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': period_id, 'message': 'Availability period created'}), 201

@app.route('/api/availability/<int:period_id>', methods=['DELETE'])
def delete_availability(period_id):
    """Delete an availability period"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM availability_periods WHERE id = ?', (period_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Availability period deleted successfully'})

# Proposed tasks endpoints
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all proposed tasks"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM proposed_tasks ORDER BY created_at DESC')
    tasks = [dict(row) for row in cursor.fetchall()]
    
    # Parse required_skills to array
    for task in tasks:
        task['required_skills'] = task['required_skills'].split(',') if task['required_skills'] else []
    
    conn.close()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task proposal"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    skills_str = ','.join(data.get('required_skills', []))
    cursor.execute('''
        INSERT INTO proposed_tasks 
        (chief_id, chief_name, title, description, required_skills, required_department, 
         priority, estimated_days, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (data['chief_id'], data['chief_name'], data['title'], data.get('description', ''),
          skills_str, data.get('required_department', ''), data.get('priority', 'medium'),
          data.get('estimated_days', 1), data.get('start_date'), data.get('end_date')))
    
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': task_id, 'message': 'Task proposed successfully'}), 201

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task proposal"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM proposed_tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task deleted successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    if 'status' in data:
        cursor.execute('UPDATE proposed_tasks SET status = ? WHERE id = ?', 
                      (data['status'], task_id))
    
    if 'matched_worker_id' in data:
        cursor.execute('UPDATE proposed_tasks SET matched_worker_id = ?, status = ? WHERE id = ?',
                      (data['matched_worker_id'], 'matched', task_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task updated successfully'})

# Task assignments endpoints
@app.route('/api/assignments', methods=['GET'])
def get_assignments():
    """Get all task assignments"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.*, t.title, t.description, t.priority, w.name as worker_name
        FROM task_assignments a
        JOIN proposed_tasks t ON a.task_id = t.id
        JOIN workers w ON a.worker_id = w.id
        ORDER BY a.start_date
    ''')
    assignments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(assignments)

@app.route('/api/assignments/confirm', methods=['POST'])
def confirm_assignment():
    """Admin confirms a proposed match and creates assignment"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO task_assignments 
        (task_id, worker_id, start_date, end_date, match_score, status)
        VALUES (?, ?, ?, ?, ?, 'assigned')
    ''', (data['task_id'], data['worker_id'], data['start_date'], 
          data['end_date'], data.get('match_score', 0)))
    
    # Update task status
    cursor.execute('UPDATE proposed_tasks SET status = ?, matched_worker_id = ? WHERE id = ?',
                  ('assigned', data['worker_id'], data['task_id']))
    
    assignment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': assignment_id, 'message': 'Assignment confirmed successfully'}), 201

@app.route('/api/assignments/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    """Delete an assignment and reset task to pending"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get task_id before deleting
    cursor.execute('SELECT task_id FROM task_assignments WHERE id = ?', (assignment_id,))
    result = cursor.fetchone()
    
    if result:
        task_id = result['task_id']
        
        # Delete assignment
        cursor.execute('DELETE FROM task_assignments WHERE id = ?', (assignment_id,))
        
        # Reset task to pending
        cursor.execute('UPDATE proposed_tasks SET status = ?, matched_worker_id = NULL WHERE id = ?',
                      ('pending', task_id))
        
        conn.commit()
    
    conn.close()
    
    return jsonify({'message': 'Assignment cancelled successfully'})

@app.route('/api/assignments', methods=['POST'])
def create_assignment():
    """Create a task assignment (kept for compatibility)"""
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO task_assignments 
        (task_id, worker_id, start_date, end_date, match_score, status)
        VALUES (?, ?, ?, ?, ?, 'assigned')
    ''', (data['task_id'], data['worker_id'], data['start_date'], 
          data['end_date'], data.get('match_score', 0)))
    
    # Update task status
    cursor.execute('UPDATE proposed_tasks SET status = ?, matched_worker_id = ? WHERE id = ?',
                  ('assigned', data['worker_id'], data['task_id']))
    
    assignment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': assignment_id, 'message': 'Task assigned successfully'}), 201

# Matching algorithm endpoint
@app.route('/api/match-tasks', methods=['POST'])
def match_tasks():
    """Run matching algorithm to propose task-worker assignments"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get pending tasks
    cursor.execute("SELECT * FROM proposed_tasks WHERE status = 'pending'")
    pending_tasks = [dict(row) for row in cursor.fetchall()]
    
    # Get all workers with their availability
    cursor.execute('SELECT * FROM workers')
    workers_data = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('SELECT * FROM availability_periods')
    availability_data = [dict(row) for row in cursor.fetchall()]
    
    # Get existing assignments to avoid double-booking
    cursor.execute('SELECT * FROM task_assignments WHERE status = "assigned"')
    existing_assignments = [dict(row) for row in cursor.fetchall()]
    
    matches = []
    
    for task in pending_tasks:
        candidates = []
        
        task_skills = set(task['required_skills'].split(',')) if task['required_skills'] else set()
        
        for worker in workers_data:
            worker_skills = set(worker['skills'].split(',')) if worker['skills'] else set()
            score = 0
            
            # Skill match (30 points)
            if task_skills:
                skill_match = len(task_skills & worker_skills) / len(task_skills)
                score += skill_match * 30
            
            # Department match (30 points)
            if task['required_department'] and worker['department'] == task['required_department']:
                score += 30
            
            # Availability match (40 points)
            worker_availability = [a for a in availability_data if a['worker_id'] == worker['id']]
            has_availability = False
            if worker_availability:
                for avail in worker_availability:
                    if task['start_date'] >= avail['start_date'] and task['end_date'] <= avail['end_date']:
                        # Check if worker is not already assigned during this period
                        is_available = True
                        for assignment in existing_assignments:
                            if assignment['worker_id'] == worker['id']:
                                # Check for date overlap
                                if not (task['end_date'] < assignment['start_date'] or task['start_date'] > assignment['end_date']):
                                    is_available = False
                                    break
                        if is_available:
                            score += 40
                            has_availability = True
                        break
            
            if has_availability:  # Include all potential matches
                candidates.append({
                    'task_id': task['id'],
                    'task_title': task['title'],
                    'worker_id': worker['id'],
                    'worker_name': worker['name'],
                    'worker_department': worker['department'],
                    'worker_skills': worker['skills'],
                    'score': score,
                    'has_availability': has_availability
                })
        
        # Sort candidates by score
        candidates.sort(key=lambda x: x['score'], reverse=True)
        
        # Take top 3 candidates for each task
        if candidates:
            matches.append({
                'task': task,
                'candidates': candidates[:3]  # Top 3 matches
            })
    
    conn.close()
    
    return jsonify({'matches': matches, 'count': len(matches)})

@app.route('/')
def serve_index():
    """Serve the main HTML file"""
    return send_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files like app.js"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    print("=" * 50)
    print("🚀 WorkForce Scheduler API Server")
    print("=" * 50)
    print(f"📁 Database: {DB_FILE}")
    print(f"🌐 Server: http://localhost:5000")
    print(f"📊 API Docs: http://localhost:5000/api/health")
    print("=" * 50)
    
    # Run the Flask app
    app.run(host='127.0.0.1', port=8020, debug=False)
    # app.run(debug=False)
