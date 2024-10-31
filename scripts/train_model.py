import sys
import pandas as pd
import json
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC, SVR
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from sklearn.metrics import accuracy_score, mean_squared_error

def train_model(file_path, features, target, model_type):
    df = pd.read_csv(file_path)
    selected_features = features.split(',')
    target_variable = target

    X = df[selected_features]
    y = df[target_variable]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if model_type == "SVM_C":
        model = SVC()
    elif model_type == "RF_C":
        model = RandomForestClassifier()
    elif model_type == "LGBM_C":
        model = LGBMClassifier()
    elif model_type == "SVM_R":
        model = SVR()
    elif model_type == "RF_R":
        model = RandomForestRegressor()
    elif model_type == "LGBM_R":
        model = LGBMRegressor()
    else:
        raise ValueError("Invalid model type")

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    if model_type.endswith("_C"):
        score = accuracy_score(y_test, y_pred) * 100
    else:
        score = mean_squared_error(y_test, y_pred, squared=False)

    result = {"score": score}
    return result

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python train_model.py <csv_file_path> <features> <target> <model_type>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    features = sys.argv[2]
    target = sys.argv[3]
    model_type = sys.argv[4]

    result = train_model(csv_file_path, features, target, model_type)
    print(json.dumps(result))
