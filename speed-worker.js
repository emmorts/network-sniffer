const exec = require('child_process').exec;
const sqlite = require('sqlite3').verbose();
const config = require("./config/index");
const db = new sqlite.Database(config.databasePath);

db.run("CREATE TABLE IF NOT EXISTS speed (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, mbits DECIMAL(10, 5), timestamp INTEGER)");

checkInternetSpeed();

function checkInternetSpeed() {
  console.log('Running internet speed test...')
  exec('curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python -', (error, stdout, stderr) => {
    if (error) {
      console.log(`Failed to run internet speed check, ${error}`);
    }
    console.log(stdout);

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