"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'templates'));

app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
const upload = (0, multer_1.default)({ dest: 'uploads/' });
let dataFilePath = null;
let selectedFeatures = [];
let targetVariable = null;
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'templates', 'index.html'));
});
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        dataFilePath = req.file.path;
        res.redirect('/select_variables');
    }
    else {
        res.status(400).send('File upload failed');
    }
});
app.get('/select_variables', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'templates', 'select_variables.html'));
    if (dataFilePath) {
        (0, child_process_1.exec)(`python scripts/get_columns.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const columns = JSON.parse(stdout);
                res.render('select_variables', { columns });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/select_variables', (req, res) => {
    selectedFeatures = req.body.features;
    targetVariable = req.body.target;
    res.redirect('/process_variables');
}
);

app.get('/process_variables', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'templates', 'process_variables.html'));
}
);

app.post('/process_variables', (req, res) => {
    if (dataFilePath) {
        selectedFeatures = req.body.features;
        targetVariable = req.body.target;
        (0, child_process_1.exec)(`python scripts/process_variables.py ${dataFilePath} ${selectedFeatures.join(',')} ${targetVariable}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, features: selectedFeatures, target: targetVariable });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});

app.post('/handle_missing', (req, res) => {
    if (dataFilePath) {
        const missingHandling = req.body;
        (0, child_process_1.exec)(`python scripts/handle_missing.py ${dataFilePath} ${JSON.stringify(missingHandling)}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message1: '欠損値の処理が成功しました。' });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});
app.post('/process_categorical', (req, res) => {
    if (dataFilePath) {
        (0, child_process_1.exec)(`python scripts/process_categorical.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message2: 'ワンホットエンコーディングが成功しました。' });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});
app.post('/standardize', (req, res) => {
    if (dataFilePath) {
        (0, child_process_1.exec)(`python scripts/standardize.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message3: '標準化が成功しました。' });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});
app.post('/normalize', (req, res) => {
    if (dataFilePath) {
        (0, child_process_1.exec)(`python scripts/normalize.py ${dataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const missingValues = JSON.parse(stdout);
                res.render('process_variables', { missingValues, message3: '正規化が成功しました。' });
            }
        });
    }
    else {
        res.status(400).send('No data file uploaded');
    }
});
app.post('/select_model', (req, res) => {
    res.redirect('/train_model');
});
app.get('/train_model', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'templates', 'train_model.html'));
});
app.post('/train_model', (req, res) => {
    if (dataFilePath && targetVariable) {
        const modelType = req.body.model;
        (0, child_process_1.exec)(`python scripts/train_model.py ${dataFilePath} ${selectedFeatures.join(',')} ${targetVariable} ${modelType}`, (error, stdout, stderr) => {
            if (error) {
                res.status(500).send(`Error: ${stderr}`);
            }
            else {
                const result = JSON.parse(stdout);
                res.render('results', { model: modelType, score: result.score });
            }
        });
    }
    else {
        res.status(400).send('No data file or target variable selected');
    }
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
