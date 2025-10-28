from flask import Flask, render_template, jsonify, request
import random
from backend.model_utils import predict_flood_risk

import flood_predictor
import warnings
warnings.filterwarnings("ignore")

standalone_predictor = flood_predictor.FloodRiskPredictorStandalone()

app = Flask(__name__)
# -------------------------------
# Main Pages
# -------------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simulation')
def simulation():
    return render_template('simulation.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/historical')
def historical():
    return render_template('historical.html')

@app.route('/alerts')
def alerts():
    return render_template('alerts.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# -------------------------------
# Data Fetching Endpoint
# -------------------------------
@app.route('/fetch_data')
def fetch_data():
    """Simulated environmental data (mocked for now)."""
    data = {
        "rainfall": round(random.uniform(5, 100), 2),
        "river_discharge": round(random.uniform(50, 500), 2),
        "water_level": round(random.uniform(1, 15), 2),
        "soil_moisture": round(random.uniform(10, 70), 2),
        "temperature": round(random.uniform(10, 40), 1),
        "humidity": round(random.uniform(30, 90), 1),
        "wind_speed": round(random.uniform(1, 20), 1),
        "pressure": round(random.uniform(900, 1020), 1),
        "elevation": round(random.uniform(10, 2500), 1),
        "population_density": round(random.uniform(100, 2000), 1),
        "drainage_efficiency": round(random.uniform(50, 100), 1),
        "distance_to_coast": round(random.uniform(0, 500), 1),
        "deforestation_index": round(random.uniform(0, 100), 1)
    }

    risk = predict_flood_risk(data)
    data["flood_risk"] = risk
    return jsonify(data)

# -------------------------------
# Contact Form Submission
# -------------------------------
@app.route('/submit_contact', methods=['POST'])
def submit_contact():
    """Handles contact form submissions."""
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')

    print("\n--- New Contact Submission ---")
    print(f"Name: {name}")
    print(f"Email: {email}")
    print(f"Subject: {subject}")
    print(f"Message: {message}")
    print("-------------------------------\n")

    return jsonify({"status": "success", "message": "Message received successfully!"})

# -------------------------------
# Admin API Endpoints (Optional)
# -------------------------------
@app.route('/api/admin/stats')
def admin_stats():
    """Example API endpoint for admin dashboard."""
    stats = {
        "total_predictions": random.randint(50, 500),
        "avg_risk": random.choice(["Low", "Moderate", "High"]),
        "active_users": random.randint(5, 50)
    }
    return jsonify(stats)

@app.route('/fetch_alerts')
def fetch_alerts():
    # Simulate real-time alerts
    regions = ["Ganga Basin", "Yamuna Basin", "Brahmaputra Basin", "Godavari Basin", "Mahanadi Basin"]
    alert_levels = ["Low Flood Risk", "Moderate Flood Risk", "High Flood Risk"]

    alerts = []
    for _ in range(5):  # 5 random alerts
        region = random.choice(regions)
        level = random.choice(alert_levels)
        lat = round(random.uniform(20.0, 30.0), 3)
        lon = round(random.uniform(75.0, 95.0), 3)
        time = f"2025-10-26 {random.randint(0,23)}:{random.randint(0,59):02d}"
        alerts.append({"title": level, "region": region, "lat": lat, "lon": lon, "time": time})

    return jsonify(alerts)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    result = {}
    if standalone_predictor.model:
        try:
            result = standalone_predictor.predict(**data)
            result["success"] = True
        
        except (ValueError, RuntimeError) as e:
            result["success"] = False
    
    return jsonify(result)


# -------------------------------
# Run the App
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)
