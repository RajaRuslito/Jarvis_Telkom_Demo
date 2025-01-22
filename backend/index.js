// server/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jaRoute = require('./Routes/jaRoute');
const jrRoute = require('./Routes/jrRoute');
const jpiRoute = require('./Routes/jpiRoute');
const msRoute = require('./Routes/msRoute');
const accountRoute = require('./Routes/accountRoute');
const cjRoute = require('./Routes/createJobRoute');
const mjRoute = require('./Routes/mappingRoute')
const dotenv = require('dotenv');
const multer = require("multer");
const app = express();
const PORT = 5000;
const upload = multer();
const pool = require('./db');


require('dotenv').config();

// console.log(process.env.password);
app.use(cors());
app.use(express.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(express.json());

//app.use('/uploads', express.static('uploads'));
app.use('/jobdesc/ja', jaRoute);
app.use('/jobdesc/jpi', jpiRoute);
app.use('/jobdesc/jr', jrRoute);
app.use('/jobdesc/ms', msRoute);
app.use('/account', accountRoute);
app.use('/job/cj', cjRoute);
app.use('/job/mj', mjRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error(err);
  else console.log('Connected to NeonDB:', res.rows);
});