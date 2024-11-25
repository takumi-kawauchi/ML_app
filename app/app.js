"use strict";
const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const multer = require("multer");

const app = express();
const port = 3000;

// 設定
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let dataFilePath = null; // アップロードされたデータファイルのパス
let selectedFeatures = []; // 選択された特徴量
let targetVariable = null; // ターゲット変数

// ルートページ
app.get("/", (req, res) => {
  res.render("index");
});

// ファイルアップロード
app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    dataFilePath = req.file.path;
    res.redirect("/select_variables");
  } else {
    res.status(400).send("File upload failed");
  }
});

// 変数選択画面の表示
app.get("/select_variables", (req, res) => {
  if (dataFilePath) {
    exec(`python scripts/get_columns.py ${dataFilePath}`, (error, stdout, stderr) => {
      if (error) {
        res.status(500).send(`Error: ${stderr}`);
      } else {
        try {
          const columns = JSON.parse(stdout);
          res.render("select_variables", { columns });
        } catch (parseError) {
          res.status(500).send(`Error parsing JSON: ${parseError.message}`);
        }
      }
    });
  } else {
    res.status(400).send("No data file uploaded");
  }
});

// 変数選択後の処理
app.post("/select_variables", (req, res) => {
  const { features, target } = req.body;

  if (!features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).send("No features selected");
  }
  if (!target) {
    return res.status(400).send("No target variable selected");
  }

  selectedFeatures = features;
  targetVariable = target;

  res.redirect("/process_variables");
});

// 変数処理画面の表示
app.get("/process_variables", (req, res) => {
  if (!dataFilePath) {
    return res.status(400).send("No data file uploaded");
  }
  res.render("process_variables", {
    features: selectedFeatures,
    target: targetVariable,
    missingValues: null,
  });
});

// 欠損値処理のエンドポイント修正例
app.post("/handle_missing", (req, res) => {
    if (dataFilePath) {
      const missingHandling = req.body;
  
      exec(
        `python scripts/handle_missing.py ${dataFilePath} '${JSON.stringify(missingHandling)}'`,
        (error, stdout, stderr) => {
          if (error) {
            return res.status(500).send(`Error: ${stderr}`);
          }
  
          let missingValues;
          try {
            missingValues = JSON.parse(stdout);
          } catch (err) {
            return res.status(500).send("Error parsing missing values output");
          }
  
          res.render("process_variables", {
            missingValues,
            message1: "欠損値の処理が成功しました。",
            message2: null,
            message3: null,
            features: selectedFeatures,
            target: targetVariable,
          });
        }
      );
    } else {
      res.status(400).send("No data file uploaded");
    }
  });
  

app.post("/process_categorical", (req, res) => {
  if (dataFilePath) {
    exec(`python scripts/process_categorical.py ${dataFilePath}`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).send(`Error: ${stderr}`);
      }

      let missingValues;
      try {
        missingValues = JSON.parse(stdout);
      } catch (err) {
        return res.status(500).send("Error parsing missing values output");
      }

      res.render("process_variables", {
        missingValues,
        message1: null,
        message2: "ワンホットエンコーディングが成功しました。",
        message3: null,
        features: selectedFeatures,
        target: targetVariable,
      });
    });
  } else {
    res.status(400).send("No data file uploaded");
  }
});

// データ標準化
app.post("/standardize", (req, res) => {
  if (!dataFilePath) {
    return res.status(400).send("No data file uploaded");
  }

  exec(`python scripts/standardize.py ${dataFilePath}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error: ${stderr}`);
    } else {
      try {
        const missingValues = JSON.parse(stdout);
        res.render("process_variables", {
          missingValues,
          message3: "標準化が成功しました。",
          features: selectedFeatures,
          target: targetVariable,
        });
      } catch (err) {
        res.status(500).send("Error parsing missing values output");
      }
    }
  });
});

// データ正規化
app.post("/normalize", (req, res) => {
  if (!dataFilePath) {
    return res.status(400).send("No data file uploaded");
  }

  exec(`python scripts/normalize.py ${dataFilePath}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error: ${stderr}`);
    } else {
      try {
        const missingValues = JSON.parse(stdout);
        res.render("process_variables", {
          missingValues,
          message3: "正規化が成功しました。",
          features: selectedFeatures,
          target: targetVariable,
        });
      } catch (err) {
        res.status(500).send("Error parsing missing values output");
      }
    }
  });
});

// モデル選択後、トレーニングページへ
app.post("/select_model", (req, res) => {
  res.redirect("/train_model");
});

// モデルトレーニング画面表示
app.get("/train_model", (req, res) => {
  res.render("train_model");
});

// モデルトレーニング実行
app.post("/train_model", (req, res) => {
  if (!dataFilePath || !targetVariable) {
    return res.status(400).send("No data file or target variable selected");
  }

  const modelType = req.body.model;

  exec(
    `python scripts/train_model.py ${dataFilePath} ${selectedFeatures.join(",")} ${targetVariable} ${modelType}`,
    (error, stdout, stderr) => {
      if (error) {
        res.status(500).send(`Error: ${stderr}`);
      } else {
        try {
          const result = JSON.parse(stdout);
          res.render("results", { model: modelType, score: result.score });
        } catch (err) {
          res.status(500).send("Error parsing model training results");
        }
      }
    }
  );
});

// サーバー開始
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
