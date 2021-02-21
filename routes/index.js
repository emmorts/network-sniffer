var express = require('express');
var moment = require('moment');
var router = express.Router();
var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('./db/log.db');

/* GET home page. */
router.get('/', function(req, res) {
  db.all("SELECT * FROM device", function (error, result) {
    if (error) {
      throw error;
    }
    if (result) {
      var devices = result
        .sort(sortByTimestamp)
        .filter(function (device) {
          return device.name !== 'dir-320';
        })
        .map(function (device) {
          device.activeOn = moment(device.timestamp).fromNow();
          return device;
        });
    }
    res.render('index', {
      devices: devices
    });
  });
});

router.get('/api/history/:id', function (req, res) {
  var lastDay = moment().add(-24, 'hours').unix() * 1000;
  db.all("SELECT timestamp FROM deviceHistory WHERE deviceId = ? and timestamp > ?",
    req.params.id, lastDay, function (error, result) {
    if (error) {
      throw error;
    }
    if (result && result.length > 0) {
      var timestamps = result
        .map(function (historyItem) {
          return historyItem.timestamp;
        })
        .sort();
      res.json(timestamps);
    } else {
      res.status(204).send();
    }
  })
});

router.patch('/api/device/:id', function (req, res) {
  var id = req.params.id;
  var alias = req.body.alias;
  db.run('UPDATE device SET alias = ? WHERE id = ?', alias, id, function (error, result) {
    if (error) {
      throw error;
    }
    res.status(204).send();
  });
});

function sortByTimestamp (a, b) {
  return b.timestamp - a.timestamp;
}

module.exports = router;
