import sys
import pandas as pd
import json

def get_columns(file_path):
    df = pd.read_csv(file_path)
    columns = df.columns.tolist()
    return columns

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python get_columns.py <csv_file_path>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    columns = get_columns(csv_file_path)
    print(json.dumps(columns))
