def predict_risk(temp, wave, wind):
    if wave > 3 or wind > 15:
        return "⚠️ Fishing is risky due to rough conditions."
    else:
        return "✅ Fishing conditions look safe."
