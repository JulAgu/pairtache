import sqlite3
from omegaconf import OmegaConf
cfg = OmegaConf.load("config.yaml")

# Database initialization
def init_db():
    """Initialize the SQLite database with tables"""
    conn = sqlite3.connect(cfg.db.path)
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