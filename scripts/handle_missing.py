import sys
import pandas as pd
import json

def handle_missing(file_path, missing_instructions):
    df = pd.read_csv(file_path)
    instructions = json.loads(missing_instructions)

    for feature, method in instructions.items():
        if method == "mean":
            df[feature].fillna(df[feature].mean(), inplace=True)
        elif method == "delete":
            df.dropna(subset=[feature], inplace=True)

    df.to_csv(file_path, index=False)

    updated_missing_values = {}
    for feature in df.columns:
        updated_missing_values[feature] = df[feature].isnull().sum()

    return updated_missing_values

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python handle_missing.py <csv_file_path> <missing_instructions>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    missing_instructions = sys.argv[2]

    updated_missing_values = handle_missing(csv_file_path, missing_instructions)
    print(json.dumps(updated_missing_values))
