const bcrypt = require("bcryptjs")
const db = require("../db")
const validator = require("validator")

let User = function (data) {
  this.data = data
  this.errors = []
}

User.prototype.cleanUp = function () {
  if (typeof this.data.username != "string") {
    this.data.username = ""
  }
  if (typeof this.data.email != "string") {
    this.data.email = ""
  }
  if (typeof this.data.password != "string") {
    this.data.password = ""
  }

  // get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == "") {
      this.errors.push("You must provide a username.")
    }
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers.")
    }
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address.")
    }
    if (this.data.password == "") {
      this.errors.push("You must provide a password.")
    }
    if (this.data.password.length > 0 && this.data.password.length < 12) {
      this.errors.push("Password must be at least 12 characters.")
    }
    if (this.data.password.length > 50) {
      this.errors.push("Password cannot exceed 50 characters.")
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username must be at least 3 characters.")
    }
    if (this.data.username.length > 30) {
      this.errors.push("Username cannot exceed 30 characters.")
    }

    // Only if username is valid then check to see if it's already taken
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      const [[{ taken }]] = await db.execute("SELECT count(*) as taken FROM users WHERE username = ?", [this.data.username])
      if (taken) {
        this.errors.push("That username is already taken.")
      }
    }

    // Only if email is valid then check to see if it's already taken
    if (validator.isEmail(this.data.email)) {
      const [[{ taken }]] = await db.execute("SELECT count(*) as taken FROM users WHERE email = ?", [this.data.email])
      if (taken) {
        this.errors.push("That email is already being used.")
      }
    }
    resolve()
  })
}

User.prototype.login = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    const [results] = await db.execute("SELECT * FROM users WHERE username = ?", [this.data.username])
    if (results.length && bcrypt.compareSync(this.data.password, results[0].password)) {
      this.data = results[0]
      resolve("Congrats!")
    } else {
      reject("Invalid username / password.")
    }
  })
}

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate user data
    this.cleanUp()
    await this.validate()

    // Step #2: Only if there are no validation errors
    // then save the user data into a database
    if (!this.errors.length) {
      // hash user password
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      const [[info, [user]]] = await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?); SELECT * FROM users WHERE _id = LAST_INSERT_ID();", [this.data.username, this.data.email, this.data.password])
      this.data._id = user._id
      this.data.avatar = user.avatar
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

User.findByUsername = function (username) {
  return new Promise(async function (resolve, reject) {
    if (typeof username != "string") {
      reject()
      return
    }
    const [users] = await db.execute("SELECT username, avatar, _id FROM users WHERE username = ?", [username])
    if (users.length) {
      resolve(users[0])
    } else {
      reject()
    }
  })
}

User.doesEmailExist = function (email) {
  return new Promise(async function (resolve, reject) {
    if (typeof email != "string") {
      resolve(false)
      return
    }

    const [[{ taken }]] = await db.execute("SELECT count(*) as taken FROM users WHERE email = ?", [email])
    if (taken) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

module.exports = User
