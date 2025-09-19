import sqlite3
import json
import random
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET')
if not app.secret_key:
    raise RuntimeError("SESSION_SECRET environment variable must be set")

# Carbon footprint reduction values (kg CO2 saved)
CARBON_SAVINGS = {
    'bike_instead_drive': 2.3,  # per 10km
    'reusable_bottle': 0.1,     # per use
    'walk_short_distance': 0.8,  # per 5km
    'public_transport': 1.2,     # per trip
    'energy_saving': 0.5,       # per day
    'plant_based_meal': 1.4,    # per meal
}

# Initialize database


def init_db():
    conn = sqlite3.connect('habits.db')
    c = conn.cursor()

    # Create users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
             (id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              created_date DATE DEFAULT CURRENT_DATE)''')
    # Create habits table
    c.execute('''CREATE TABLE IF NOT EXISTS habits
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  description TEXT,
                  carbon_type TEXT,
                  points INTEGER DEFAULT 10,
                  created_date DATE DEFAULT CURRENT_DATE)''')

    # Create user_progress table
    c.execute('''CREATE TABLE IF NOT EXISTS user_progress
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  habit_id INTEGER,
                  completed_date DATE DEFAULT CURRENT_DATE,
                  points_earned INTEGER DEFAULT 10,
                  carbon_saved REAL DEFAULT 0.0,
                  FOREIGN KEY (habit_id) REFERENCES habits(id))''')

    # Insert default habits if table is empty
    c.execute("SELECT COUNT(*) FROM habits")
    if c.fetchone()[0] == 0:
        default_habits = [
            ('Bike instead of driving',
             'Choose biking over driving for short distances', 'bike_instead_drive', 15),
            ('Use reusable water bottle',
             'Avoid single-use plastic bottles', 'reusable_bottle', 10),
            ('Walk for short trips', 'Walk instead of driving for nearby errands',
             'walk_short_distance', 12),
            ('Take public transport',
             'Use public transport instead of personal vehicle', 'public_transport', 12),
            ('Turn off lights when leaving',
             'Save energy by switching off unnecessary lights', 'energy_saving', 8),
            ('Eat a plant-based meal',
             'Choose vegetarian/vegan options', 'plant_based_meal', 18),
        ]
        c.executemany(
            "INSERT INTO habits (name, description, carbon_type, points) VALUES (?, ?, ?, ?)", default_habits)

    conn.commit()
    conn.close()

# Load sustainability tips


def load_sustainability_tips():
    try:
        with open('data/sustainability_tips.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Default tips if file doesn't exist
        return [
            "Replace single-use items with reusable alternatives",
            "Use LED bulbs - they use 75% less energy than traditional bulbs",
            "Take shorter showers to conserve water and energy",
            "Unplug electronics when not in use to avoid phantom energy drain",
            "Choose walking or biking for trips under 2 miles",
            "Meal plan to reduce food waste",
            "Use both sides of paper and recycle when possible",
            "Choose local and seasonal produce when grocery shopping",
            "Air dry clothes instead of using the dryer when weather permits",
            "Use a refillable water bottle instead of buying bottled water"
        ]


def calculate_streak(cursor):
    """Calculate consecutive day streak using SQLite date functions for consistency"""
    cursor.execute("""
        SELECT DISTINCT completed_date 
        FROM user_progress 
        ORDER BY completed_date DESC
    """)
    dates = [row[0] for row in cursor.fetchall()]

    if not dates:
        return 0

    # Get today's date from SQLite for consistency
    cursor.execute("SELECT date('now')")
    today_str = cursor.fetchone()[0]

    # Check if today has any completions
    if today_str in dates:
        streak = 1
        check_date = today_str
    else:
        # If no activity today, check from yesterday
        cursor.execute("SELECT date('now', '-1 day')")
        yesterday_str = cursor.fetchone()[0]
        if yesterday_str in dates:
            streak = 1
            check_date = yesterday_str
        else:
            return 0

    # Count backwards for consecutive days using SQLite date arithmetic
    while True:
        cursor.execute("SELECT date(?, '-1 day')", (check_date,))
        check_date = cursor.fetchone()[0]
        if check_date in dates:
            streak += 1
        else:
            break

    return streak


@app.route('/')
def home():
    return render_template('home.html')


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        hashed_pw = generate_password_hash(password)

        conn = sqlite3.connect("habits.db")
        c = conn.cursor()
        try:
            c.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_pw))
            conn.commit()
        except sqlite3.IntegrityError:
            return "Username already exists!"
        finally:
            conn.close()

        return "Registration successful! <a href='/login'>Login here</a>"

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect("habits.db")
        c = conn.cursor()
        c.execute("SELECT id, password FROM users WHERE username=?", (username,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[1], password):
            session["user_id"] = user[0]
            return "Login successful! <a href='/'>Go to Dashboard</a>"
        else:
            return "Invalid username or password!"

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("user_id", None)
    return "Logged out successfully! <a href='/login'>Login again</a>"


@app.route('/dashboard')
def dashboard():
    conn = sqlite3.connect('habits.db')
    c = conn.cursor()

    # Get all habits
    c.execute("SELECT * FROM habits")
    habits = c.fetchall()

    # Get today's completed habits
    c.execute("""SELECT habit_id FROM user_progress 
                 WHERE completed_date = date('now')""")
    completed_today = [row[0] for row in c.fetchall()]

    # Calculate total points
    c.execute("SELECT SUM(points_earned) FROM user_progress")
    total_points = c.fetchone()[0] or 0

    # Calculate total carbon saved
    c.execute("SELECT SUM(carbon_saved) FROM user_progress")
    total_carbon_saved = c.fetchone()[0] or 0

    # Calculate current streak (consecutive days)
    current_streak = calculate_streak(c)

    conn.close()

    # Get a random sustainability tip
    tips = load_sustainability_tips()
    daily_tip = random.choice(tips)

    return render_template('dashboard.html',
                           habits=habits,
                           completed_today=completed_today,
                           total_points=total_points,
                           total_carbon_saved=total_carbon_saved,
                           current_streak=current_streak,
                           daily_tip=daily_tip)


@app.route('/api/complete-habit', methods=['POST'])
def complete_habit():
    if not request.json:
        return jsonify({'error': 'Invalid JSON data'}), 400
    habit_id = request.json.get('habit_id')

    conn = sqlite3.connect('habits.db')
    c = conn.cursor()

    # Check if habit already completed today
    c.execute("""SELECT * FROM user_progress 
                 WHERE habit_id = ? AND completed_date = date('now')""", (habit_id,))
    if c.fetchone():
        conn.close()
        return jsonify({'error': 'Habit already completed today'}), 400

    # Get habit details
    c.execute("SELECT * FROM habits WHERE id = ?", (habit_id,))
    habit = c.fetchone()
    if not habit:
        conn.close()
        return jsonify({'error': 'Habit not found'}), 404

    # Calculate carbon savings
    carbon_saved = CARBON_SAVINGS.get(habit[3], 0.0)  # habit[3] is carbon_type

    # Add completion record
    c.execute("""INSERT INTO user_progress (habit_id, points_earned, carbon_saved) 
                 VALUES (?, ?, ?)""", (habit_id, habit[4], carbon_saved))  # habit[4] is points

    # Get updated totals
    c.execute("SELECT SUM(points_earned) FROM user_progress")
    total_points = c.fetchone()[0]

    c.execute("SELECT SUM(carbon_saved) FROM user_progress")
    total_carbon_saved = c.fetchone()[0]

    # Calculate updated streak (consecutive days)
    current_streak = calculate_streak(c)

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'points_earned': habit[4],
        'carbon_saved': carbon_saved,
        'total_points': total_points,
        'total_carbon_saved': round(total_carbon_saved, 2),
        'current_streak': current_streak
    })


@app.route('/api/new-tip')
def get_new_tip():
    tips = load_sustainability_tips()
    return jsonify({'tip': random.choice(tips)})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
