var sys = require('sys')
var exec = require('child_process').exec;
var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('../../db/log.db');
var child;

db.run("CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, ip TEXT, timestamp INTEGER)");
db.run("CREATE TABLE IF NOT EXISTS deviceHistory (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId INTEGER, timestamp INTEGER)");

fetchConnectedDevices(updateDatabase);

function updateDatabase (devices) {
  if (devices && devices.length > 0) {
    devices.forEach(function (device) {
      var now = Date.now();
      db.get("SELECT id FROM device WHERE name = ? AND ip = ?", device.name, device.ip, function (error, result) {
        if (error) {
          throw error;
        }
        if (!result) {
          db.run("INSERT INTO device(name, ip, timestamp) VALUES (?, ?, ?)", device.name, device.ip, now);
          console.log('Added entry ' + device.name);
        } else {
          db.run("UPDATE device SET timestamp = ? WHERE id = ?", now, result.id);
          console.log('Updated entry ' + device.name);
        }
        db.get("SELECT id FROM device WHERE name = ? AND ip = ?", device.name, device.ip, function () {
          if (error) {
            throw error;
          }
          db.run("INSERT INTO deviceHistory(deviceId, timestamp) VALUES(?, ?)", result.id, now);
        });
      });
    });
  }
}

function fetchConnectedDevices (callback) {
  // var lastDay = moment().add(-48, 'hours').unix();
  // db.run("DELETE FROM deviceHistory WHERE timestamp < ?", lastDay);
  console.log('Fetching connected devices...');
  child = exec("sudo nmap -sP 192.168.2.0/24", function (error, stdout, stderr) {
    if (error) {
      throw error;
    } else if (stderr) {
      console.log('stderr: ', stderr);
    }
    var devices = parseData(stdout);
    console.log(devices.length + ' devices found.');
    if (callback) {
      callback(devices);
    }
  });
}

function parseData (data) {
  var array = [];
  if (data) {
    var pattern = new RegExp("Nmap scan report for (.+) .(.+).(?:\r)?\n", 'g');
    var row;
    while (row = pattern.exec(data)) {
      array.push({
        name: row[1],
        ip: row[2]
      });
    }
  }
  return array;
}