from flask import Flask, render_template, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch_data')
def fetch_data():
    # Simulated environmental data (mocked for now)
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
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
