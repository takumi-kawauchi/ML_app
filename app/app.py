from flask import Flask, request, render_template, jsonify
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.svm import SVR, SVC
from sklearn.metrics import mean_squared_error, accuracy_score

app = Flask(__name__)

# カラム取得用のグローバル変数
data = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global data
    file = request.files['file']
    data = pd.read_csv(file)
    columns = data.columns.tolist()
    return jsonify(columns=columns)

@app.route('/train', methods=['POST'])
def train_model():
    global data
    content = request.json
    target = content['target']
    features = content['features']
    model_type = content['model_type']
    prediction_type = content['prediction_type']
    
    X = data[features]
    y = data[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    if prediction_type == 'regression':
        model = RandomForestRegressor() if model_type == 'RF' else SVR()
    else:
        model = RandomForestClassifier() if model_type == 'RF' else SVC()
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    if prediction_type == 'regression':
        score = mean_squared_error(y_test, y_pred, squared=False)
    else:
        score = accuracy_score(y_test, y_pred)
    
    return jsonify(score=score)

if __name__ == '__main__':
    app.run(debug=True)
