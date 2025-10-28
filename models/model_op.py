import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

class GraphFloodPredictor:
    def __init__(self, model_dir="model_simple", sequence_length=72):
        self.model_dir = model_dir
        self.sequence_length = sequence_length
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False

    def generate_dataset(self, n_hours=5000):
        print("🌧 Generating synthetic rainfall and water level data...")
        rng = np.random.default_rng(42)
        rainfall = rng.uniform(0, 30, n_hours)
        discharge = rainfall * 2 + rng.normal(0, 1, n_hours)
        water_level = 1.5 + discharge * 0.05 + rng.normal(0, 0.2, n_hours)

        data = np.stack([rainfall, discharge, water_level], axis=1)
        df = pd.DataFrame(data, columns=["rainfall", "discharge", "water_level"])
        flood_flag = (df["water_level"] > (df["water_level"].mean() + 2 * df["water_level"].std())).astype(int)

        return df.values, flood_flag.values

    def create_sequence_data(self, data, labels):
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i+self.sequence_length])
            y.append(labels[i+self.sequence_length])
        return np.array(X), np.array(y)

    def build_model(self):
        model = Sequential([
            LSTM(32, return_sequences=True, input_shape=(self.sequence_length, 3)),
            LSTM(16),
            Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer=Adam(0.001), loss='binary_crossentropy', metrics=['accuracy'])
        return model

    def train_model(self, epochs=8, batch_size=32):
        data, labels = self.generate_dataset()
        scaled_data = self.scaler.fit_transform(data)

        X, y = self.create_sequence_data(scaled_data, labels)

        self.model = self.build_model()

        es = EarlyStopping(monitor='loss', patience=2, restore_best_weights=True)
        print("🚀 Training model...")
        self.model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=1, callbacks=[es])
        self.is_trained = True
        print("✅ Training complete!")

    def save_model(self):
        os.makedirs(self.model_dir, exist_ok=True)
        self.model.save(os.path.join(self.model_dir, "simple_model.keras"))
        np.save(os.path.join(self.model_dir, "scaler.npy"), self.scaler.mean_)
        np.save(os.path.join(self.model_dir, "scale.npy"), self.scaler.scale_)
        print("📦 Model and scaler saved!")

    def load_model(self):
        try:
            self.model = load_model(os.path.join(self.model_dir, "simple_model.keras"))
            self.scaler.mean_ = np.load(os.path.join(self.model_dir, "scaler.npy"))
            self.scaler.scale_ = np.load(os.path.join(self.model_dir, "scale.npy"))
            self.is_trained = True
            print("✅ Model loaded successfully!")
        except:
            print("ℹ No saved model found. Will train a new one.")
            self.is_trained = False

    def predict_realtime(self, hours=50):
        print(f"\n📡 Simulating {hours} hours of real-time forecasting...")
        rng = np.random.default_rng()
        window = rng.uniform(0,1,(self.sequence_length,3))
        flood_alert = []

        for h in range(hours):
            sample = window.reshape(1,self.sequence_length,3)
            p = self.model.predict(sample, verbose=0)[0][0]
            flood_alert.append(int(p>0.5))
            new_data = rng.uniform(0,1,3)
            window = np.vstack([window[1:], new_data])

        print("🌊 Flood alerts:", flood_alert[-10:])
        print("✅ Real-time simulation done!")

# -------------------- RUN SCRIPT --------------------
predictor = GraphFloodPredictor()
predictor.load_model()

if not predictor.is_trained:
    print("\n--- Training new model... ---")
    predictor.train_model(epochs=8)
    predictor.save_model()

predictor.predict_realtime(hours=30)
