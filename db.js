const mysql = require("mysql2/promise")

async function start() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "newuser",
    password: "newuser",
    database: "ournodeapp",
    multipleStatements: true
  })
  shapeDatabase(connection)
  module.exports = connection
  const app = require("./app")
  app.listen(3000)
}

start()

// Create tables and columns if they do not already exist.
function shapeDatabase(db) {
  db.query(`CREATE TABLE IF NOT EXISTS users (
  _id int NOT NULL AUTO_INCREMENT,
  username varchar(45) DEFAULT NULL,
  email varchar(100) DEFAULT NULL,
  password varchar(200) DEFAULT NULL,
  avatar varchar(100) GENERATED ALWAYS AS (concat(_utf8mb4'https://gravatar.com/avatar/',md5(email),_utf8mb4'?s=128')) VIRTUAL,
  PRIMARY KEY (_id)
);
`)
}
