const express = require('express');
const moment = require('moment');
const router = express.Router();
const sqlite = require('sqlite3').verbose();
const config = require("../config/index.js");
const db = new sqlite.Database(config.databasePath);

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

router.get('/api/latency', function(req, res) {
  const timeLimit = req.query.time || 5 * 60;
  const now = Date.now();
  const timestamp = now - timeLimit * 1000;

  db.all("SELECT * FROM latency WHERE timestamp > ? ORDER BY timestamp DESC", timestamp, function (error, result) {
    if (error) {
      throw error;
    }

    res.json(result);
  });
});

router.get('/api/speed', function(req, res) {
  const timeLimit = req.query.time || 5 * 60;
  const now = Date.now();
  const timestamp = now - timeLimit * 1000;

  db.all("SELECT * FROM speed WHERE timestamp > ? ORDER BY timestamp DESC", timestamp, function (error, result) {
    if (error) {
      throw error;
    }

    res.json({
      download: result.filter(x => x.type === 'download'),
      upload: result.filter(x => x.type === 'upload')
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
