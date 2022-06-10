const db = require("../db")
const User = require("./User")

let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}

Follow.prototype.cleanUp = async function () {
  if (typeof this.followedUsername != "string") {
    this.followedUsername = ""
  }
}

Follow.prototype.validate = async function (action) {
  /*===============================================
  Task #1 SEE IF USERNAME EXISTS
  You'll need: this.followedUsername
  ===============================================*/
  const [followedAccount] = await db.execute("SELECT * FROM users WHERE username = ?", [this.followedUsername])
  if (followedAccount.length) {
    this.followedId = followedAccount[0]._id
  } else {
    this.errors.push("You cannot follow a user that does not exist.")
  }

  /*===============================================
  Task #2 SEE IF THIS USER IS ALREADY FOLLOWING THIS USER
  You'll need: this.followedId, this.authorId
  ===============================================*/
  const [doesFollowAlreadyExist] = await db.execute("SELECT * FROM follows WHERE followedId = ? AND authorId = ?", [this.followedId, this.authorId])
  if (action == "create") {
    if (doesFollowAlreadyExist.length) {
      this.errors.push("You are already following this user.")
    }
  }
  if (action == "delete") {
    if (!doesFollowAlreadyExist.length) {
      this.errors.push("You cannot stop following someone you do not already follow.")
    }
  }

  // should not be able to follow yourself
  if (this.followedId == this.authorId) {
    this.errors.push("You cannot follow yourself.")
  }
}

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("create")
    if (!this.errors.length) {
      /*===============================================
      Task #3 ADD A FOLLOW INTO THE FOLLOWS TABLE
      You'll need: this.followedId, this.authorId
      ===============================================*/
      await db.execute("INSERT INTO follows (followedId, authorId) VALUES (?, ?)", [this.followedId, this.authorId])
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("delete")
    if (!this.errors.length) {
      /*===============================================
      Task #4 DELETE A FOLLOW FROM THE FOLLOWS TABLE
      You'll need: this.followedId, this.authorId
      ===============================================*/
      await db.execute("DELETE FROM follows WHERE followedId = ? AND authorId = ?", [this.followedId, this.authorId])
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  /*===============================================
  Task #5 IS THE LOGGED IN USER FOLLOWING THIS USER?
  You'll need: followedId, visitorId
  ===============================================*/
  const [follows] = await db.execute("SELECT * FROM follows WHERE followedId = ? AND authorId = ?", [followedId, visitorId])
  if (follows.length) {
    return true
  } else {
    return false
  }
}

Follow.getFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      /*===============================================
      Task #6 GET THE USERS WHO FOLLOW THIS USER
      You'll need: id
      ===============================================*/
      let [followers] = await db.execute("SELECT username, avatar FROM follows JOIN users ON follows.authorId = users._id WHERE followedId = ?", [id])
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.getFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      /*===============================================
      Task #7 GET THE USERS THAT THIS USER FOLLOWS
      You'll need: id
      ===============================================*/
      let [followers] = await db.execute("SELECT username, avatar FROM follows JOIN users ON follows.followedId = users._id WHERE authorId = ?", [id])
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.countFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    /*===============================================
    Task #8 COUNT HOW MANY PEOPLE FOLLOW THIS USER
    You'll need: id
    ===============================================*/
    const [[{ followers }]] = await db.execute("SELECT COUNT(followedId) as followers FROM follows WHERE followedId = ?", [id])
    resolve(followers)
  })
}

Follow.countFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    /*===============================================
    Task #9 COUNT HOW MANY PEOPLE THIS USER FOLLOWS
    You'll need: id
    ===============================================*/
    const [[{ following }]] = await db.execute("SELECT COUNT(followedId) as following FROM follows WHERE authorId = ?", [id])
    resolve(following)
  })
}

module.exports = Follow
