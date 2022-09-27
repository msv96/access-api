const express = require('express');
const cors = require('cors');
const fetch = (...args) =>
  import('node-fetch').then((mod) => mod.default(...args));
const { evaluate } = require('aatt');
const checkPdf = require('wcag-pdf');
const multer = require('multer');
const { unlink } = require('node:fs');

const app = express();
const port = process.env.PORT || 3005;

app.use(
  cors({
    origin: '*'
  })
);
app.use(express.json());
app.use('/tmp', express.static(__dirname + '/tmp'));

app.get('/api/v1/report', async function (req, res) {
  const { url } = req.query;
  try {
    if (url) {
      const html = await fetch(url);
      const doc = await html.text();
      const final = await evaluate({
        source: doc,
        output: 'json',
        engine: 'htmlcs',
        level: 'WCAG2A'
      });
      const result = final.includes('Object]\n')
        ? final?.split('Object]\n')[1]
        : final;
      res.status(200).json({
        status: true,
        data: JSON.parse(result),
        date: new Date().toLocaleString()
      });
    } else {
      res.status(404).json({ status: false, message: 'URL is required' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error });
  }
});

app.get('/api/v1/pdf-report', async function (req, res) {
  const { url } = req.query;
  try {
    if (url) {
      const result = await checkPdf(url);
      res.status(200).json({ status: true, data: result });
    } else {
      res.status(404).json({ status: false, message: 'PDF link is required' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error });
  }
});

app.post('/api/v1/pdf-file-report', async function (req, res) {
  try {
    const upload = multer({
      storage: multer.diskStorage({
        destination: 'tmp/',
        filename: function (_req, file, cb) {
          return cb(null, file.originalname.replace(' ', '_'));
        }
      }),
      limits: {
        fileSize: 5242880,
        files: 1
      },
      fileFilter: function (_req, file, cb) {
        const type = file.originalname.split('.');
        const ext = type[type.length - 1];
        if (ext !== 'pdf') {
          return cb(new Error(`Only pdf file is allowed`));
        }
        return cb(null, true);
      }
    }).single('myPdf');
    upload(req, res, async function (err) {
      try {
        if (err) {
          return res.status(400).send({
            error: err,
            message: 'Bad Request',
            status: false
          });
        } else {
          if (!req.file) {
            return res
              .status(404)
              .send({ status: false, message: 'File not found' });
          }
          const host = req.headers.host;
          const url = host.includes('localhost') ? `http://${host}/` : `https://${host}/`;
          const result = await checkPdf(url + req.file.path);
          unlink(req.file.path, (err) => {
            if (err) throw new Error(err);
            console.log(req.file.path + ' was deleted');
          });
          return res.status(200).send({ status: true, file: req.file, result });
        }
      } catch (error) {
        unlink(req.file.path, (err) => {
          if (err) throw new Error(err);
          console.log(req.file.path + ' was deleted');
        });
        console.log(error);
        return res.status(404).send({ status: false, message: error });
      }
    });
  } catch (error) {
    unlink(req.file.path, (err) => {
      if (err) throw new Error(err);
      console.log(req.file.path + ' was deleted');
    });
    console.log(error);
    return res.status(500).send({ status: false, message: error });
  }
});

app.listen(port, function (_req, _res) {
  console.log('server:', port);
});
