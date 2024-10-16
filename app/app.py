# app.py
from flask import Flask, request, render_template, redirect, url_for, jsonify
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from lightgbm import LGBMRegressor, LGBMClassifier
from sklearn.metrics import accuracy_score, root_mean_squared_error

app = Flask(__name__)
data = None  # グローバル変数にデータを格納

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    global data
    file = request.files['file']
    data = pd.read_csv(file)
    return redirect(url_for('select_variables'))

@app.route('/select_variables')
def select_variables():
    columns = data.columns.tolist()
    return render_template('select_variables.html', columns=columns)

@app.route('/process_variables', methods=['POST'])
def process_variables():
    global data
    selected_features = request.form.getlist('features')
    target_variable = request.form['target']
    features_data = data[selected_features]

    global features, target
    features = selected_features
    target = target_variable
    
    # 欠損値の確認
    missing_values = features_data.isnull().sum().to_dict()
    
    return render_template('process_variables.html', missing_values=missing_values, 
                           features=selected_features, target=target_variable)

# 欠損値処理エンドポイント
@app.route('/handle_missing', methods=['POST'])
def handle_missing():
    global data
    missing_handling = request.form
    try:
        for feature in data.columns:
            handling_method = missing_handling.get(f'missing_{feature}')

            if handling_method == 'mean':
                data[feature].fillna(data[feature].mean(), inplace=True)
                # inplace=Trueを用いることでデータフレームに直接的な変更が行われない可能性がある。そのため、以下のコードが勧められた。
                # data[feature] = data[feature].fillna(data[feature].mean())
            elif handling_method == 'delete':
                data.dropna(subset=[feature], inplace=True)

        message = "欠損値の処理が成功しました。"
    except Exception as e:
        message = f"エラーが発生しました: {str(e)}"

    # 欠損値のある変数とその数を再計算して渡す
    missing_values = data.isnull().sum()
    missing_values = missing_values[missing_values > 0].to_dict()

    return render_template('process_variables.html', missing_values=missing_values, message1=message)

@app.route('/process_categorical', methods=['POST'])
def process_categorical():
    global data
    try:
        # ワンホットエンコーディングの実行
        categorical_columns = data.select_dtypes(include=['object', 'category']).columns
        data = pd.get_dummies(data, columns=categorical_columns, drop_first=True)
        
        message = "ワンホットエンコーディングが成功しました。"
    except Exception as e:
        message = f"エラーが発生しました: {str(e)}"
    
    # 欠損値の再計算を行う
    missing_values = data.isnull().sum()
    missing_values = missing_values[missing_values > 0].to_dict()
    
    return render_template('process_variables.html', missing_values=missing_values, message2=message)


# 標準化エンドポイント
@app.route('/standardize', methods=['POST'])
def standardize():
    global data
    data_columns = data.columns
    try:
        scaler = StandardScaler()
        data = scaler.fit_transform(data)
        message = "標準化が成功しました。"
    except Exception as e:
        message = f"エラーが発生しました: {str(e)}"
    
    data = pd.DataFrame(data, columns=data_columns)
    
    # 欠損値の再計算を行う
    #dataをDataFrameに変換
    data = pd.DataFrame(data)
    missing_values = data.isnull().sum()
    missing_values = missing_values[missing_values > 0].to_dict()

    return render_template('process_variables.html', missing_values=missing_values, message3=message)

# 正規化エンドポイント
@app.route('/normalize', methods=['POST'])
def normalize():
    global data
    data_columns = data.columns
    try:
        scaler = MinMaxScaler()
        data = scaler.fit_transform(data)
        message = "正規化が成功しました。"
    except Exception as e:
        message = f"エラーが発生しました: {str(e)}"

    data = pd.DataFrame(data, columns=data_columns)

    # 欠損値の再計算を行う
    data = pd.DataFrame(data)
    missing_values = data.isnull().sum()
    missing_values = missing_values[missing_values > 0].to_dict()

    return render_template('process_variables.html', missing_values=missing_values, message3=message)

@app.route('/select_model', methods=['POST'])
def select_model():
    return redirect(url_for('train_model_page'))  # GET メソッド用のページにリダイレクト

@app.route('/train_model', methods=['GET'])
def train_model_page():
    return render_template('train_model.html')  # モデル選択ページを表示

@app.route('/train_model', methods=['POST'])
def train_model():
    # ここでは POST メソッドでの処理を行います
    X = data.drop(target, axis=1)
    y = data[target]
    model_type = request.form['model']
    if "C" in model_type:
        y = y.astype('category')
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    if model_type == 'SVM_R':
        model = SVR()
    elif model_type == 'RF_R':
        model = RandomForestRegressor()
    elif model_type == 'LGBM_R':
        model = LGBMRegressor()
    elif model_type == 'SVM_C':
        model = SVC()
    elif model_type == 'RF_C':
        model = RandomForestClassifier()
    elif model_type == 'LGBM_C':
        model = LGBMClassifier()


    model.fit(X_train, y_train)
    if "C" in model_type:
        y_pred = model.predict(X_test)
        score = accuracy_score(y_test, y_pred)
    else:
        y_pred = model.predict(X_test)
        score = root_mean_squared_error(y_test, y_pred)

    return render_template('results.html', model=model_type, score=score)  # 結果表示用のテンプレートを返す


if __name__ == '__main__':
    app.run(debug=True)
