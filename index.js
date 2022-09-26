import express, { json } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { evaluate } from 'aatt';
import checkPdf from 'wcag-pdf';

const app = express();
const port = process.env.PORT || 3005;

app.use(
  cors({
    origin: '*'
  })
);
app.use(json());

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
      res
        .status(200)
        .json({
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
      res.status(404).json({ status: false, message: 'PDF link or pdf file is required' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: error });
  }
});

app.listen(port, function (req, res) {
  console.log('server:', port);
});
