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

con.connect(function(err) {
  if (err) console.log(err);
  con.query("show databases", function (err, result, fields) {
    if (err) console.log(err);
    let today = new Date().toISOString().substring(0, 10);
    result.forEach(database => {
      exec(`mysqldump ${database.Database} -u ${process.env.DB_USER} --password=${process.env.DB_PASS} | gzip > ./files/${today}-${database.Database}.sql.gz`)
      fs.readFile(`./files/${today}-${database.Database}.sql.gz`, (err, data) => {
        if (err) console.log(err);
        let params = {
          Bucket: process.env.S3_REPO,
          Key: `${today}-${database.Database}.sql.gz`,
          Body: data
          }
        s3.upload(params, function(s3Err, data) {
            if (s3Err) console.log(s3Err);
            console.log(`File uploaded successfully at ${data.Location}`)
            exec(`rm ./files/${today}-${database.Database}.sql.gz`)
        });
       });
    });
    process.exit();
  });
});

