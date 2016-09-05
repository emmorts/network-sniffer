var sys = require('util')
var exec = require('child_process').exec;
var sqlite = require('sqlite3').verbose();
var db = new sqlite.Database('../../db/log.db');
var child;

db.run("CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, ip TEXT, alias TEXT, timestamp INTEGER)");
db.run("CREATE TABLE IF NOT EXISTS deviceHistory (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId INTEGER, timestamp INTEGER)");

fetchConnectedDevices(updateDatabase);

function updateDatabase (devices) {
  function updateHistory (device) {
    var now = Date.now();
    console.log("Updating history of " + device.name + "(" + device.ip + ")");
    db.get("SELECT id FROM device WHERE (name = $name OR alias = $name) AND ip = $ip",
      { $name: device.name, $ip: device.ip }, function (error, result) {
      if (error) {
        throw error;
      }
      if (!result) {
        console.log("Device was not found; failed to update history.");
      } else {
        db.run("INSERT INTO deviceHistory(deviceId, timestamp) VALUES(?, ?)", result.id, now, function (error, result) {
          console.log("History of " + device.ip + " was updated");
        });
      }
    });
  }
  if (devices && devices.length > 0) {
    devices.forEach(function (device) {
      var now = Date.now();
      db.get("SELECT id FROM device WHERE (name = $name OR alias = $name) AND ip = $ip",
        { $name: device.name, $ip: device.ip }, function (error, result) {
        if (error) {
          throw error;
        }
        if (!result) {
          db.run("INSERT INTO device(name, ip, timestamp) VALUES (?, ?, ?)", device.name, device.ip, now, function (error) {
            if (!error){
              console.log('Added entry ' + device.name);
              updateHistory(device);
            }
          });
        } else {
          db.run("UPDATE device SET timestamp = ? WHERE id = ?", now, result.id, function (error) {
            if (!error){
              console.log('Updated entry ' + device.name);
              updateHistory(device);
            }
          });
        }
      });
    });
  }
}

function fetchConnectedDevices (callback) {
  // var lastDay = moment().add(-48, 'hours').unix();
  // db.run("DELETE FROM deviceHistory WHERE timestamp < ?", lastDay);
  console.log('Fetching connected devices...');
  child = exec("nmap -sP 192.168.0.1/24", function (error, stdout, stderr) {
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
    var pattern = new RegExp("Nmap scan report for ?([a-zA-Z0-9\-]+)? [^0-9]?([0-9.]+)", 'g');
    var row;
    while (row = pattern.exec(data)) {
      var name = row[1] || 'n/a';
      array.push({
        name: name,
        ip: row[2]
      });
    }
  }
  return array;
}