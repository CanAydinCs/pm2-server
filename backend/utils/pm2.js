const pm2 = require('pm2');

function connect() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function list() {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) reject(err);
      else resolve(list);
    });
  });
}

function start(options) {
  return new Promise((resolve, reject) => {
    pm2.start(options, (err, apps) => {
      if (err) reject(err);
      else resolve(apps);
    });
  });
}

function stop(name) {
  return new Promise((resolve, reject) => {
    pm2.stop(name, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function restart(name) {
  return new Promise((resolve, reject) => {
    pm2.restart(name, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function reload(name) {
  return new Promise((resolve, reject) => {
    pm2.reload(name, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function del(name) {
  return new Promise((resolve, reject) => {
    pm2.delete(name, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function describe(name) {
  return new Promise((resolve, reject) => {
    pm2.describe(name, (err, desc) => {
      if (err) reject(err);
      else resolve(desc);
    });
  });
}

function raw() {
  return pm2;
}

module.exports = { connect, list, start, stop, restart, reload, del, describe, raw };
