def predict_flood_risk(params):
    score = (
        params['rainfall'] * 0.3 +
        params['river_discharge'] * 0.2 +
        params['water_level'] * 0.1 +
        params['soil_moisture'] * 0.1 +
        params['humidity'] * 0.05 +
        params['wind_speed'] * 0.05 +
        params['pressure'] * 0.05 +
        params['deforestation_index'] * 0.15
    )
    return "High Risk" if score > 150 else "Moderate Risk" if score > 80 else "Low Risk"
