var express = require('express');
var router = express.Router();

router.get('/report', function (req, res) {
  const { url } = req.query;
  res.json({ msg: 'hi', url });
});

module.exports = router;
