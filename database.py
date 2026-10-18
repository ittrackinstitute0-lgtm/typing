import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'typing_master.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT,
        highest_level_unlocked INTEGER DEFAULT 1,
        best_wpm REAL DEFAULT 0,
        average_accuracy REAL DEFAULT 0,
        total_tests INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level_number INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        target_wpm INTEGER DEFAULT 20,
        min_accuracy INTEGER DEFAULT 85,
        time_limit INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        level_id INTEGER,
        level_number INTEGER,
        mode TEXT DEFAULT 'level',
        wpm REAL NOT NULL,
        raw_wpm REAL NOT NULL,
        accuracy REAL NOT NULL,
        errors_count INTEGER DEFAULT 0,
        time_seconds REAL NOT NULL,
        passed INTEGER DEFAULT 0,
        stars INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')

    # Seed Admin User if not exists
    cursor.execute('SELECT COUNT(*) FROM admin_users')
    if cursor.fetchone()[0] == 0:
        default_hash = generate_password_hash('admin123')
        cursor.execute(
            'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
            ('admin', default_hash)
        )

    # Seed Default Settings
    default_settings = [
        ('site_name', 'TypePulse Modern Typing'),
        ('enforce_level_lock', 'true'),
        ('allow_guest_tests', 'true'),
        ('announcement', 'Welcome to TypePulse! Complete levels to unlock badges.')
    ]
    for key, val in default_settings:
        cursor.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', (key, val))

    # Seed Default Levels if empty
    cursor.execute('SELECT COUNT(*) FROM levels')
    if cursor.fetchone()[0] == 0:
        seed_levels = [
            (
                1,
                "Home Row Foundations",
                "Home Row",
                "Master the anchor keys: A S D F for the left hand and J K L ; for the right hand.",
                "asdf jkl; asdf jkl; sad dad lad fall flask ask all salad dads lads flak fads flask",
                18,
                85,
                0
            ),
            (
                2,
                "Home Row Fluency",
                "Home Row",
                "Build muscle memory and word flow using pure home row letters.",
                "a sad dad asks a lad all fall as a flask falls dad asks a lad to ask all dad had a flask",
                22,
                90,
                0
            ),
            (
                3,
                "Top Row Reach (E, R, U, I, O)",
                "Top Row",
                "Extend your index and middle fingers to reach the high-frequency top vowels and letters.",
                "read fire safe side file user sure ride dire rule look road free fear soul silk leaf lake deal real dare rule order",
                25,
                90,
                0
            ),
            (
                4,
                "Bottom Row Navigation (C, V, B, N, M)",
                "Bottom Row",
                "Train lower finger dexterity and bottom row transitions cleanly.",
                "come back move man can vim calm ban mob beam vain cab bean mock combine carbon bench balance cabin normal",
                28,
                90,
                0
            ),
            (
                5,
                "Common English Rhythm",
                "Full Alphabet",
                "Smooth flow through top 100 English words to establish automatic typing cadence.",
                "the quick brown fox jumps over the lazy dog they have been working hard to build their skills every single day with focus",
                32,
                92,
                0
            ),
            (
                6,
                "Capitalization & Punctuation",
                "Punctuation",
                "Integrate Shift keys, commas, periods, apostrophes, and question marks smoothly.",
                "Practice doesn't make perfect; only perfect practice makes perfect. Hard work beats talent when talent doesn't work hard!",
                35,
                92,
                0
            ),
            (
                7,
                "Number Row & Mixed Symbols",
                "Numbers & Symbols",
                "Conquer the top number row and monetary symbols without looking down at the keyboard.",
                "In 2026, over 95% of developers use typing tests. Room 404 has 12 laptops, 35 keyboards, and 88 cables priced at $49.99.",
                30,
                90,
                0
            ),
            (
                8,
                "Developer Code Syntax",
                "Programming",
                "Crucial brackets {}, [], arrows =>, semicolons, and code structures for programmers.",
                "const speed = (chars / 5) / (time / 60); if (accuracy >= 95) { return \"Level Passed!\"; } else { retry(); }",
                35,
                90,
                0
            ),
            (
                9,
                "High Speed Sprint",
                "Speed Rush",
                "Fast burst typing to break past speed plateaus and elevate your WPM.",
                "system power energy lightning speed stream quick flow motion action target rhythm impact boost rapid pulse reflex champion victory",
                45,
                94,
                0
            ),
            (
                10,
                "Master Typist Final Trial",
                "Grandmaster",
                "Prose mastery, long sentence cadence, and ultimate finger dexterity test.",
                "Excellence is not an extraordinary thing, but a series of ordinary actions performed extraordinarily well. Master your fingertips, cultivate your rhythm, and unlock your boundless potential.",
                55,
                95,
                0
            )
        ]

        for lvl in seed_levels:
            cursor.execute('''
            INSERT INTO levels (level_number, title, category, description, content, target_wpm, min_accuracy, time_limit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', lvl)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
