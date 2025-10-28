import os
import numpy as np
import pandas as pd
import joblib
from collections import deque
import warnings

# --- HPC & Parallel Computing ---
import dask
import dask.dataframe as dd
from dask.distributed import Client, LocalCluster
import dask_ml.preprocessing

# --- ML Models ---
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

warnings.filterwarnings('ignore')


class HybridHPCPredictor:
    def __init__(self, model_dir="model_hybrid_hpc", sequence_length=72):
        self.model_dir = model_dir
        self.sequence_length = sequence_length
        self.is_trained = False

        # --- Model 1: HPC (XGBoost) ---
        self.model_xgb = None
        self.scaler_xgb = dask_ml.preprocessing.StandardScaler()
        self.model_xgb_path = os.path.join(self.model_dir, "xgb_model.json")
        self.scaler_xgb_path = os.path.join(self.model_dir, "scaler_xgb.joblib")
        # These features will be created by engineer_features_dask
        self.engineered_features = []

        # --- Model 2: Temporal (LSTM) ---
        self.model_lstm = None
        self.scaler_lstm = StandardScaler() # Use scikit-learn for the smaller sample
        self.model_lstm_path = os.path.join(self.model_dir, "lstm_model.keras")
        self.scaler_lstm_path = os.path.join(self.model_dir, "scaler_lstm.joblib")
        
        self.base_features = ["rainfall", "discharge", "water_level"]


    def generate_dataset(self, n_hours=5000):
        # (Using your improved data generation)
        print(f"🌧 Generating {n_hours} hours of synthetic data...")
        rng = np.random.default_rng(42)
        rainfall = rng.uniform(0, 30, n_hours)
        storm_indices = rng.integers(0, n_hours, n_hours // 50)
        rainfall[storm_indices] += rng.uniform(20, 50, len(storm_indices))
        
        discharge = rainfall * 2 + rng.normal(0, 1, n_hours)
        water_level = 1.5 + discharge * 0.05 + rng.normal(0, 0.2, n_hours)
        water_level = np.clip(water_level, 0, None)

        data = np.stack([rainfall, discharge, water_level], axis=1)
        df = pd.DataFrame(data, columns=self.base_features)
        
        flood_flag = (df["water_level"] > df["water_level"].quantile(0.95)).astype(int)
        df['flood_occurred'] = flood_flag
        return df

    def engineer_features_dask(self, ddf):
        """Creates time-series features in parallel using Dask."""
        print("🛠 Engineering features in parallel...")
        # (This is a simplified version of Phase 3's engineering)
        ddf['rainfall_24h_sum'] = ddf['rainfall'].rolling(window=24).sum()
        ddf['water_level_6h_avg'] = ddf['water_level'].rolling(window=6).mean()
        ddf['water_level_diff_1h'] = ddf['water_level'].diff(1)
        ddf['discharge_lag_3h'] = ddf['discharge'].shift(3)

        # Store engineered feature names
        self.engineered_features = [
            'rainfall', 'discharge', 'water_level',
            'rainfall_24h_sum', 'water_level_6h_avg',
            'water_level_diff_1h', 'discharge_lag_3h'
        ]
        
        # Drop NaNs created by rolling/lag
        ddf = ddf.dropna()
        return ddf

    def create_sequence_data(self, data, labels):
        # (Copied from your script)
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i+self.sequence_length])
            y.append(labels[i+self.sequence_length - 1])
        return np.array(X), np.array(y)

    def build_lstm_model(self):
        # (Copied from your script)
        model = Sequential([
            LSTM(32, return_sequences=True, input_shape=(self.sequence_length, 3)),
            LSTM(16),
            Dense(1, activation='sigmoid')
        ])
        model.compile(optimizer=Adam(0.001), loss='binary_crossentropy', metrics=['accuracy'])
        return model

    def train_model(self, epochs=8, batch_size=32):
        # --- 1. Generate Massive Dataset ---
        # Generate 1M hours. This is too big for Pandas, perfect for Dask.
        df = self.generate_dataset(n_hours=1_000_000)
        # Convert to Dask DataFrame, chunking into 10 partitions
        ddf = dd.from_pandas(df, npartitions=10)
        
        # --- 2. Train HPC Model (Dask-XGBoost) ---
        print("\n--- [HPC Pipeline] Training Dask-XGBoost Model ---")
        ddf_eng = self.engineer_features_dask(ddf)
        
        X = ddf_eng[self.engineered_features]
        y = ddf_eng['flood_occurred']
        
        print("Scaling HPC features (Dask-ML)...")
        X_scaled = self.scaler_xgb.fit_transform(X)
        
        # Split data (time-series aware)
        train_frac = 0.8
        X_train, X_test = X_scaled.loc[:train_frac], X_scaled.loc[train_frac:]
        y_train, y_test = y.loc[:train_frac], y.loc[train_frac:]

        print("Training Dask-XGBoost model (distributed)...")
        # This will use the Dask client we set up in main()
        dask_model = xgb.dask.DaskXGBClassifier(
            n_estimators=100,
            max_depth=5,
            objective='binary:logistic',
            tree_method='hist'
        )
        dask_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], early_stopping_rounds=10, verbose=False)
        
        # Save the final (non-Dask) booster model
        self.model_xgb = dask_model.client.sync(dask_model.best_model)
        print("✅ HPC Model Trained.")

        # --- 3. Train Temporal Model (LSTM) ---
        print("\n--- [Temporal Pipeline] Training LSTM Model ---")
        # We can't train the LSTM on 1M rows easily.
        # We'll take a 50k sample to train the temporal patterns.
        df_sample = ddf.sample(frac=0.05).compute() # 50,000 rows
        
        data_lstm = df_sample[self.base_features].values
        labels_lstm = df_sample['flood_occurred'].values
        
        print("Scaling LSTM features...")
        scaled_data_lstm = self.scaler_lstm.fit_transform(data_lstm)
        X_seq, y_seq = self.create_sequence_data(scaled_data_lstm, labels_lstm)

        self.model_lstm = self.build_lstm_model()
        es = EarlyStopping(monitor='loss', patience=2, restore_best_weights=True)
        
        print("Training LSTM model...")
        self.model_lstm.fit(X_seq, y_seq, epochs=epochs, batch_size=batch_size, verbose=1, callbacks=[es])
        print("✅ Temporal (LSTM) Model Trained.")
        
        self.is_trained = True

    def save_model(self):
        os.makedirs(self.model_dir, exist_ok=True)
        # Save LSTM
        self.model_lstm.save(self.model_lstm_path)
        joblib.dump(self.scaler_lstm, self.scaler_lstm_path)
        # Save XGB
        self.model_xgb.save_model(self.model_xgb_path)
        joblib.dump(self.scaler_xgb, self.scaler_xgb_path)
        print("📦 Both Hybrid Models and Scalers saved!")

    def load_model(self):
        try:
            # Load LSTM
            self.model_lstm = load_model(self.model_lstm_path)
            self.scaler_lstm = joblib.load(self.scaler_lstm_path)
            # Load XGB
            self.model_xgb = xgb.Booster()
            self.model_xgb.load_model(self.model_xgb_path)
            self.scaler_xgb = joblib.load(self.scaler_xgb_path)
            
            # Re-populate engineered features (lost on load)
            self.engineer_features_dask(dd.from_pandas(pd.DataFrame(columns=self.base_features), npartitions=1))
            
            self.is_trained = True
            print("✅ Both Hybrid Models loaded successfully!")
        except Exception as e:
            print(f"ℹ No saved models found ({e}). Will train a new set.")
            self.is_trained = False

    def predict_realtime(self, hours=50):
        print(f"\n📡 Simulating {hours} hours of HYBRID real-time forecasting...")
        rng = np.random.default_rng()
        
        # We need a longer buffer for the XGB feature engineering (e.g., 24h)
        # We'll use 100 hours to be safe.
        buffer_len = 100 
        print(f"Generating initial {buffer_len}-hour history buffer...")
        history_df, _ = self.generate_dataset(n_hours=buffer_len)
        history_deque = deque(history_df[self.base_features].values, maxlen=buffer_len)

        flood_alert = []

        for h in range(hours):
            # --- 1. Get LSTM Prediction ---
            # Get the last 72 hours
            lstm_window_raw = np.array(list(history_deque))[-self.sequence_length:]
            lstm_window_scaled = self.scaler_lstm.transform(lstm_window_raw)
            lstm_sample = lstm_window_scaled.reshape(1, self.sequence_length, 3)
            prob_lstm = self.model_lstm.predict(lstm_sample, verbose=0)[0][0]

            # --- 2. Get XGBoost Prediction ---
            # Get the full buffer and engineer features
            xgb_buffer_df = pd.DataFrame(data=list(history_deque), columns=self.base_features)
            xgb_features_df = self.engineer_features_dask(xgb_buffer_df) # This works on pandas too
            
            # Get the *last* row of engineered features
            xgb_latest_features = xgb_features_df[self.engineered_features].iloc[[-1]] # Keep as 2D array
            
            xgb_latest_scaled = self.scaler_xgb.transform(xgb_latest_features)
            
            # Convert to DMatrix for XGBoost
            dmatrix = xgb.DMatrix(xgb_latest_scaled)
            prob_xgb = self.model_xgb.predict(dmatrix)[0]

            # --- 3. Ensemble (Hybrid) Prediction ---
            final_prob = (prob_lstm * 0.5) + (prob_xgb * 0.5) # Simple 50/50 blend
            
            is_flood = final_prob > 0.5
            flood_alert.append(int(is_flood))
            
            if is_flood:
                print(f"  Hour {h}: 🚨 FLOOD WARNING! (Prob: {final_prob:.2f} [LSTM:{prob_lstm:.2f}, XGB:{prob_xgb:.2f}])")
            
            # --- 4. Generate and add new data point ---
            new_rainfall = rng.uniform(0, 30)
            if rng.random() < 0.02: new_rainfall += rng.uniform(20, 50)
            new_discharge = new_rainfall * 2 + rng.normal(0, 1)
            new_water_level = 1.5 + new_discharge * 0.05 + rng.normal(0, 0.2)
            new_data_point = np.array([new_rainfall, new_discharge, new_water_level])
            
            history_deque.append(new_data_point)

        print("\n🌊 Last 10 flood alerts:", flood_alert[-10:])
        print("✅ Real-time hybrid simulation done!")

# -------------------- RUN SCRIPT --------------------
if __name__ == "__main__":
    # This check is CRITICAL for Dask to work
    
    # --- Setup HPC Dask Cluster ---
    # This uses all your local cores to simulate an HPC cluster
    with LocalCluster(n_workers=4, threads_per_worker=2, memory_limit='2GB') as cluster:
        with Client(cluster) as client:
            print("="*50)
            print(f"🚀 Dask HPC Client Ready: {client.dashboard_link}")
            print("="*50)
            
            predictor = HybridHPCPredictor()
            predictor.load_model()

            if not predictor.is_trained:
                print("\n--- Training new hybrid models... ---")
                predictor.train_model(epochs=8)
                predictor.save_model()

            predictor.predict_realtime(hours=30)
