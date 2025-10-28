def predict_flood_risk(params):
    """
    Basic risk prediction model.
    Takes environmental parameters and computes a flood risk score.
    """

    score = (
        params.get('rainfall', 0) * 0.3 +
        params.get('river_discharge', 0) * 0.2 +
        params.get('water_level', 0) * 0.1 +
        params.get('soil_moisture', 0) * 0.1 +
        params.get('humidity', 0) * 0.05 +
        params.get('wind_speed', 0) * 0.05 +
        params.get('pressure', 0) * 0.05 +
        params.get('deforestation_index', 0) * 0.15
    )

    if score > 150:
        return "High Risk ⚠️"
    elif score > 80:
        return "Moderate Risk ⚡"
    else:
        return "Low Risk ✅"
