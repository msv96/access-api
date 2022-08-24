const express = require('express');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();
const port = process.env.PORT || 3004;

app.use(
  cors({
    origin: '*',
  })
);
app.use(express.json());
app.use('/api/v1', indexRouter);

app.listen(port, function (req, res) {
  console.log('server:', port);
});
