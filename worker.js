const exec = require('child_process').exec;
const sqlite = require('sqlite3').verbose();
const config = require("./config/index");
const db = new sqlite.Database(config.databasePath);

let child;

db.run("CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, ip TEXT, alias TEXT, timestamp INTEGER)");
db.run("CREATE TABLE IF NOT EXISTS deviceHistory (id INTEGER PRIMARY KEY AUTOINCREMENT, deviceId INTEGER, timestamp INTEGER)");

fetchConnectedDevices(updateDatabase);

function updateDatabase (devices) {
  function updateHistory (device) {
    const now = Date.now();
    console.log("Updating history of " + device.name + " (" + device.ip + ")");
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
      const now = Date.now();
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
  child = exec("nmap -sn 192.168.1.0/24", function (error, stdout, stderr) {
    console.log(stdout);
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
  const array = [];

  if (data) {
    const pattern = new RegExp("Nmap scan report for ?([a-zA-Z0-9\-\.]+)? [^0-9]?([0-9.]+)", 'g');
    let row;
    while (row = pattern.exec(data)) {
      const name = row[1] || 'n/a';
      array.push({
        name: name.replace('.lan', ''),
        ip: row[2]
      });
    }
  }
  return array;
}