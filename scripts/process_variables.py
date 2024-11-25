import sys
import pandas as pd
import json

def process_variables(file_path, features, target):
    df = pd.read_csv(file_path)
    selected_features = features.split(',')
    target_variable = target

    missing_values = {}
    for feature in selected_features:
        missing_values[feature] = df[feature].isnull().sum()

    return missing_values

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python process_variables.py <csv_file_path> <features> <target>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    features = sys.argv[2]
    target = sys.argv[3]

    missing_values = process_variables(csv_file_path, features, target)
    # print(json.dumps(missing_values))
