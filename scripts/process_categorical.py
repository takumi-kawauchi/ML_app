import sys
import pandas as pd
import json

def process_categorical(file_path):
    df = pd.read_csv(file_path)
    categorical_columns = df.select_dtypes(include=['object', 'category']).columns

    df = pd.get_dummies(df, columns=categorical_columns, drop_first=True)
    df.to_csv(file_path, index=False)

    updated_missing_values = {}
    for feature in df.columns:
        updated_missing_values[feature] = df[feature].isnull().sum()

    return updated_missing_values

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_categorical.py <csv_file_path>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    updated_missing_values = process_categorical(csv_file_path)
    print(json.dumps(updated_missing_values))
