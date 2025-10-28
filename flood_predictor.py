import joblib
import numpy as np
from datetime import datetime

class FloodRiskPredictorStandalone:
    def __init__(self, model_path='universal_flood_model.joblib'):
        """
        Loads the pre-trained model and required feature columns.
        """
        print(f"🔄 Loading model from {model_path}...")
        try:
            self.model = joblib.load(model_path)
            print("✅ Model loaded successfully.")
        except FileNotFoundError:
            print(f"❌ ERROR: Model file not found at {model_path}")
            print("Please run the 'flood_predictor.py' script first to train and save the model.")
            self.model = None
        except Exception as e:
            print(f"❌ ERROR: Could not load model. {e}")
            self.model = None

        # This MUST match the order used during training in flood_predictor.py
        self.feature_columns = [
            'rainfall_mm', 'river_discharge_cumec', 'water_level_m',
            'soil_moisture_percent', 'temperature_c', 'humidity_percent', 'wind_speed_ms',
            'pressure_hpa', 'elevation_m', 'population_density', 'drainage_efficiency',
            'distance_to_coast_km', 'deforestation_index'
        ]

    def predict(self, **kwargs):
        """
        Predicts flood risk from a dictionary of physical conditions.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded. Cannot make predictions.")

        # Validate that all required features are present
        try:
            # Prepare feature vector in the exact order
            features = np.array([kwargs[param] for param in self.feature_columns]).reshape(1, -1)
        except KeyError as e:
            raise ValueError(f"❌ Missing parameter: {e}. All required parameters must be provided.")
        
        # Make prediction
        prediction = self.model.predict(features)[0]
        probability = self.model.predict_proba(features)[0][1]

        # Risk assessment and recommendation logic
        if probability >= 0.85:
            risk_level = "🚨 CRITICAL"
            recommendation = "IMMEDIATE EVACUATION may be required! Contact authorities."
        elif probability >= 0.65:
            risk_level = "🔴 HIGH"
            recommendation = "Take immediate precautionary measures. Prepare for potential evacuation."
        elif probability >= 0.45:
            risk_level = "🟠 MEDIUM"
            recommendation = "Monitor conditions closely. Prepare emergency supplies."
        elif probability >= 0.25:
            risk_level = "🟡 LOW"
            recommendation = "Stay alert and monitor weather updates."
        else:
            risk_level = "🟢 SAFE"
            recommendation = "Current conditions appear normal."

        return {
            'prediction': 'FLOOD WARNING' if prediction == 1 else 'NORMAL CONDITIONS',
            'probability': round(probability, 3),
            'risk_level': risk_level,
            'recommendation': recommendation,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
