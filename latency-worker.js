#!/usr/bin/env node
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const sqlite = require('sqlite3').verbose();
const config = require("./config/index");
const db = new sqlite.Database(config.databasePath);

let child;

db.run("CREATE TABLE IF NOT EXISTS latency (id INTEGER PRIMARY KEY AUTOINCREMENT, host TEXT, ping DECIMAL(10, 5), timestamp INTEGER)");
db.run("CREATE TABLE IF NOT EXISTS speed (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, mbits DECIMAL(10, 5), timestamp INTEGER)");

pingHost();
checkInternetSpeed();
setInterval(() => checkInternetSpeed(), 60 * 1000);

function pingHost() {
  const isWin = process.platform === 'win32';
  const pingArgs = [config.pingHost];
  const commandPath = isWin ? 'ping' : '/bin/ping'
  if (isWin) {
    pingArgs.splice(0, 0, '-t');
  }
  const ping = spawn(commandPath, pingArgs);
  
  ping.stdout.on('data', function (data) {
    const latency = parsePingResponse(data.toString());
    if (latency) {
      db.run("INSERT INTO latency(host, ping, timestamp) VALUES (?, ?, ?)", config.pingHost, latency, Date.now(), function (error) {
        console.log(`Latency: ${latency}`);
      });
    }
  });
  
  ping.stderr.on('data', function (data) {
    console.log('stderr: ' + data.toString());
  });
  
  ping.on('error', function (code) {
    console.log(error);
  });
  
  ping.on('exit', function (code) {
    console.log('child process exited with code ' + code.toString());
  });
}

function checkInternetSpeed() {
  exec('curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python -', (error, stdout, stderr) => {
    if (error) {
      console.log(`Failed to run internet speed check, ${error}`);
    }

    const [down, up] = parseInternetSpeed(stdout);
    if (down && up) {
      db.run("INSERT INTO speed(type, mbits, timestamp) VALUES (?, ?, ?)", 'download', down, Date.now(), function (error) {
        if (error) {
          console.log(error);
        }
      });
      db.run("INSERT INTO speed(type, mbits, timestamp) VALUES (?, ?, ?)", 'upload', up, Date.now(), function (error) {
        if (error) {
          console.log(error);
        }
      });
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
    }
  });

}

function parsePingResponse(string) {
  const pattern = /time=(\d+)ms/;
  const match = string.match(pattern);
  if (match) {
    return match[1];
  }

  return null;
}

function parseInternetSpeed(string) {
  let download, upload;

  const downloadPattern = /Download: (.+) Mbit\/s/;
  const downloadMatch = string.match(downloadPattern);
  if (downloadMatch) {
    download = downloadMatch[1];
  }

  const uploadPattern = /Upload: (.+) Mbit\/s/;
  const uploadMatch = string.match(uploadPattern);
  if (uploadMatch) {
    upload = uploadMatch[1];
  }

  return [download, upload];
}