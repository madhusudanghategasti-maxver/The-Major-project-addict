"""
Flask backend connecting the trained MindGuard pipeline to the UI.

Run:
    pip install flask flask-cors joblib pandas scikit-learn
    python app.py
"""
import os

import joblib
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

UI_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(UI_DIR)

app = Flask(
    __name__,
    static_folder=UI_DIR,
    static_url_path="",
)
CORS(app)  # allows your website to call this API from another origin

# Load the FULL pipeline (preprocessor + model), saved with:
#   joblib.dump(gsb.best_estimator_, "model.joblib")
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(PROJECT_DIR, "model.joblib"),
)
model = joblib.load(MODEL_PATH)

# Use the exact column names and order the pipeline was trained on.
# (Available when the pipeline was fitted on a pandas DataFrame.)
if hasattr(model, "feature_names_in_"):
    FEATURES = list(model.feature_names_in_)
else:
    # Fallback: edit this list to match your training columns exactly.
    FEATURES = [
        "age", "gender", "screen", "social", "gaming", "work",
        "notifications", "sleep", "stress", "opens", "impact", "weekend",
    ]

FEATURE_ALIASES = {
    "daily_screen_time_hours": "screen",
    "social_media_hours": "social",
    "gaming_hours": "gaming",
    "work_study_hours": "work",
    "sleep_hours": "sleep",
    "notifications_per_day": "notifications",
    "app_opens_per_day": "opens",
    "weekend_screen_time": "weekend",
    "stress_level": "stress",
    "academic_work_impact": "impact",
}

# Only fill this in if you manually encoded columns BEFORE training.
# If your preprocessor (OneHotEncoder / OrdinalEncoder) handles text
# categories, leave it empty so the pipeline receives the raw strings.
# Example:
#   ENCODINGS = {
#       "gender": {"Male": 0, "Female": 1, "Other": 2},
#       "stress": {"Low": 0, "Moderate": 1, "High": 2},
#       "impact": {"Low": 0, "Moderate": 1, "High": 2},
#   }
ENCODINGS = {}

# Probability of the "Addicted" class (label 1)
classes = list(model.classes_)
POSITIVE_INDEX = classes.index(1) if 1 in classes else len(classes) - 1


@app.route("/")
@app.route("/index")
@app.route("/index.html")
def index():
    return send_from_directory(UI_DIR, "index.html")


@app.route("/home")
@app.route("/home.html")
def home():
    return send_from_directory(UI_DIR, "home.html")


@app.route("/predict")
@app.route("/predict.html")
def predict_page():
    return send_from_directory(UI_DIR, "predict.html")


@app.route("/result")
@app.route("/result.html")
def result_page():
    return send_from_directory(UI_DIR, "result.html")


@app.route("/tips")
@app.route("/tips.html")
def tips_page():
    return send_from_directory(UI_DIR, "tips.html")


def clean(value):
    """Turn numeric strings from the form into numbers; trim other text."""
    if isinstance(value, str):
        value = value.strip()
        try:
            return float(value)
        except ValueError:
            return value
    return value


def risk_level(probability):
    if probability >= 0.65:
        return "High"
    if probability >= 0.35:
        return "Moderate"
    return "Low"


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object in the request body."}), 400

    missing = [
        f for f in FEATURES
        if f not in data and FEATURE_ALIASES.get(f, f) not in data
    ]
    if missing:
        return jsonify({"error": "Missing fields", "fields": missing}), 400

    values = {}
    for feature in FEATURES:
        input_key = FEATURE_ALIASES.get(feature, feature)
        value = clean(data[feature] if feature in data else data[input_key])
        if feature in ENCODINGS:
            if value not in ENCODINGS[feature]:
                return jsonify({
                    "error": f"Invalid value for '{feature}'",
                    "allowed": list(ENCODINGS[feature]),
                }), 400
            value = ENCODINGS[feature][value]
        values[feature] = value

    row = pd.DataFrame([values], columns=FEATURES)

    try:
        label = int(model.predict(row)[0])
        probability = float(model.predict_proba(row)[0][POSITIVE_INDEX])
    except Exception as exc:  # bad types, unseen formats, etc.
        return jsonify({"error": f"Prediction failed: {exc}"}), 400

    return jsonify({
        "label": label,
        "risk": risk_level(probability),
        "probability": probability,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")