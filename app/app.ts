import express from 'express';
import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import multer from 'multer';
import fs from 'fs';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

let dataFilePath: string | null = null;
let selectedFeatures: string[] = [];
let targetVariable: string | null = null;

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    if (req.file) {
        dataFilePath = req.file.path;
        res.redirect('/select_variables');
    } else {
        res.status(400).send('File upload failed');
    }
});

app.get('/select_variables', (req: Request, res: Response) => {
    if (dataFilePath) {
        exec(`python scripts/get_columns.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const columns = JSON.parse(stdout);
                res.render('select_variables', { columns });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/process_variables', (req: Request, res: Response) => {
    if (dataFilePath) {
        selectedFeatures = req.body.features;
        targetVariable = req.body.target;
        exec(`python scripts/process_variables.py ${dataFilePath} ${selectedFeatures.join(',')} ${targetVariable}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, features: selectedFeatures, target: targetVariable });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/handle_missing', (req: Request, res: Response) => {
    if (dataFilePath) {
        const missingHandling = req.body;
        exec(`python scripts/handle_missing.py ${dataFilePath} ${JSON.stringify(missingHandling)}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message1: '欠損値の処理が成功しました。' });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/process_categorical', (req: Request, res: Response) => {
    if (dataFilePath) {
        exec(`python scripts/process_categorical.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message2: 'ワンホットエンコーディングが成功しました。' });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/standardize', (req: Request, res: Response) => {
    if (dataFilePath) {
        exec(`python scripts/standardize.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message3: '標準化が成功しました。' });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/normalize', (req: Request, res: Response) => {
    if (dataFilePath) {
        exec(`python scripts/normalize.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message3: '正規化が成功しました。' });
            }
        });
    } else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/select_model', (req: Request, res: Response) => {
    res.redirect('/train_model');
});

app.get('/train_model', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'templates', 'train_model.html'));
});

app.post('/train_model', (req: Request, res: Response) => {
    if (dataFilePath && targetVariable) {
        const modelType = req.body.model;
        exec(`python scripts/train_model.py ${dataFilePath} ${selectedFeatures.join(',')} ${targetVariable} ${modelType}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            } else {
                const result = JSON.parse(stdout);
                res.render('results', { model: modelType, score: result.score });
            }
        });
    } else {
        res.status(400).send('No data file or target variable selected');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
