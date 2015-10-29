var express = require('express');
var moment = require('moment');
var router = express.Router();
var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('../../db/log.db');

/* GET home page. */
router.get('/', function(req, res) {
  var query = "SELECT * FROM device";
  db.all(query, function (error, result) {
    if (result) {
      var devices = result
        .sort(sortByTimestamp)
        .filter(function (device) {
          return device.name !== 'easy.box';
        })
        .map(function (device) {
          device.activeOn = moment(device.timestamp).fromNow();
          return device;
        });
    }
    if (error) {
      throw error;
    }
    res.render('index', {
      devices: devices
    });
  });
});

function sortByTimestamp (a, b) {
  return b.timestamp - a.timestamp;
}

module.exports = router;
