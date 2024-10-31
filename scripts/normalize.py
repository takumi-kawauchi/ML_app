import sys
import pandas as pd
import json
from sklearn.preprocessing import MinMaxScaler

def normalize(file_path):
    df = pd.read_csv(file_path)
    numerical_columns = df.select_dtypes(include=['float64', 'int64']).columns

    scaler = MinMaxScaler()
    df[numerical_columns] = scaler.fit_transform(df[numerical_columns])

    df.to_csv(file_path, index=False)

    updated_missing_values = {}
    for feature in df.columns:
        updated_missing_values[feature] = df[feature].isnull().sum()

    return updated_missing_values

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python normalize.py <csv_file_path>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    updated_missing_values = normalize(csv_file_path)
    print(json.dumps(updated_missing_values))
