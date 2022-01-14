var mysql = require('mysql');
var { exec } = require("child_process");
require('dotenv').config()

var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

con.connect(function(err) {
  if (err) throw err;
  con.query("show databases", function (err, result, fields) {
    if (err) throw err;
    let today = new Date().toISOString();
    result.forEach(database => {
      exec(`mysqldump ${database.Database} -u ${process.env.DB_USER} --password=${process.env.DB_PASS} | gzip > ./files/${today}${database.Database}.sql.gz
        && aws s3 cp ./files/${today}${database.Database}.sql.gz s3://${process.env.S3_REPO} 
        && git rm ./files/${today}${database.Database}sql.gz
      `)
    });
    process.exit();
  });
});

