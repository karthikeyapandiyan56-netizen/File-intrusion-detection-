import hashlib
import os
import json
from datetime import datetime
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

MONITOR_FOLDER = 'my_files'
BASELINE_FILE = 'baseline.json'

def calculate_hash(filepath):
    """Calculates the SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()
    except Exception:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/baseline', methods=['POST'])
def create_baseline():
    """Creates a new baseline of file hashes."""
    if not os.path.exists(MONITOR_FOLDER):
        os.makedirs(MONITOR_FOLDER)
        
    baseline = {}
    for root, _, files in os.walk(MONITOR_FOLDER):
        for file in files:
            filepath = os.path.join(root, file)
            file_hash = calculate_hash(filepath)
            if file_hash:
                baseline[filepath] = file_hash
    
    with open(BASELINE_FILE, 'w') as f:
        json.dump(baseline, f, indent=4)
        
    return jsonify({"message": "Baseline created successfully!", "count": len(baseline)})

@app.route('/api/check', methods=['GET'])
def check_integrity():
    """Compares current file hashes against the baseline."""
    if not os.path.exists(BASELINE_FILE):
        return jsonify({"error": "No baseline found"}), 400

    with open(BASELINE_FILE, 'r') as f:
        baseline = json.load(f)

    current_files = []
    alerts = []
    
    # Check for modified or new files
    for root, _, files in os.walk(MONITOR_FOLDER):
        for file in files:
            filepath = os.path.join(root, file)
            current_files.append(filepath)
            
            file_hash = calculate_hash(filepath)
            if filepath not in baseline:
                alerts.append({"type": "new", "file": filepath, "time": datetime.now().strftime("%H:%M:%S")})
            elif baseline[filepath] != file_hash:
                alerts.append({"type": "modified", "file": filepath, "time": datetime.now().strftime("%H:%M:%S")})
                
    # Check for deleted files
    for filepath in baseline:
        if filepath not in current_files:
            alerts.append({"type": "deleted", "file": filepath, "time": datetime.now().strftime("%H:%M:%S")})

    return jsonify({"alerts": alerts})

if __name__ == '__main__':
    # Ensure monitor folder exists
    if not os.path.exists(MONITOR_FOLDER):
        os.makedirs(MONITOR_FOLDER)
    # Ensure a test file exists so there is something to monitor
    test_file_path = os.path.join(MONITOR_FOLDER, 'secret.txt')
    if not os.path.exists(test_file_path):
        with open(test_file_path, 'w') as f:
            f.write("This is a super secret file!\nIf anyone changes this, the alarm should go off!")
            
    print("\n" + "="*50)
    print("🚀 File Integrity Monitor is starting...")
    print("👉 Open your browser and go to: http://127.0.0.1:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, port=5000)
