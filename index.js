var mysql = require('mysql');
var { exec } = require("child_process");
var fs = require('fs');
var AWS = require('aws-sdk');

require('dotenv').config()

var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

var s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

con.connect(async (err) => {
  if (err) console.log(err);
  await con.query("show databases", async (err, result, fields) => {
    if (err) console.log(err);
    let today = new Date().toISOString().substring(0, 10);
    await result.forEach(async database => {
      await execPromise(`mysqldump ${database.Database} -h ${process.env.DB_HOST} -u ${process.env.DB_USER} --password=${process.env.DB_PASS} | gzip > ./files/${today}-${database.Database}.sql.gz`)
      let fileContent = await fs.readFileSync(`./files/${today}-${database.Database}.sql.gz`);
      try {
        const stored = await s3.upload({
          Bucket: process.env.S3_REPO,
          Key: `${today}-${database.Database}.sql.gz`,
          Body: fileContent
          }).promise()
          console.log(`File uploaded successfully at ${stored.Location}`)
      } catch (err) {
        console.log(err)
      }
      await execPromise(`rm ./files/${today}-${database.Database}.sql.gz`)
    });
  });
});

// exit after few seconsds
new Promise(resolve => setTimeout(() => {process.exit()}, process.env.KILL_PROCESS_AFTER_X_SEC));


function execPromise(command) {
  return new Promise(function(resolve, reject) {
      exec(command, (error, stdout, stderr) => {
          if (error) {
              reject(error);
              return;
          }

          resolve(stdout.trim());
      });
  });
}