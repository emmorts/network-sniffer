#!/usr/bin/env node
const spawn = require('child_process').spawn;
const sqlite = require('sqlite3').verbose();
const config = require("./config/index");
const db = new sqlite.Database(config.databasePath);

let child;

db.run("CREATE TABLE IF NOT EXISTS latency (id INTEGER PRIMARY KEY AUTOINCREMENT, host TEXT, ping DECIMAL(10, 5), timestamp INTEGER)");

pingHost();

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

function parsePingResponse(string) {
  const pattern = /time=(\d+)ms/;
  const match = string.match(pattern);
  if (match) {
    return match[1];
  }

  return null;
}