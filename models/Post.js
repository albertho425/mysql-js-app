const db = require("../db")
const User = require("./User")
const sanitizeHTML = require("sanitize-html")

let Post = function (data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function () {
  if (typeof this.data.title != "string") {
    this.data.title = ""
  }
  if (typeof this.data.body != "string") {
    this.data.body = ""
  }

  function leadingZero(x) {
    if (x < 10) {
      return "0" + x
    } else {
      return x
    }
  }

  let date = new Date()
  let day = leadingZero(date.getDate())
  let hours = leadingZero(date.getHours())
  let minutes = leadingZero(date.getMinutes())
  let seconds = leadingZero(date.getSeconds())
  let month = leadingZero(date.getMonth() + 1)
  fullDate = `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}:${seconds}`

  this.data = {
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: {} }),
    createdDate: fullDate,
    author: this.userid
  }
}

Post.prototype.validate = function () {
  if (this.data.title == "") {
    this.errors.push("You must provide a title.")
  }
  if (this.data.body == "") {
    this.errors.push("You must provide post content.")
  }
}

Post.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      const incoming = {
        title: this.data.title,
        body: this.data.body,
        createdDate: this.data.createdDate,
        author: this.data.author
      }
      /*===============================================
      Task #1 CREATE A POST
      You'll need: incoming.title, incoming.body, incoming.author, and incoming.createdDate
      ===============================================*/
      const [{ insertId }] = await db.execute("INSERT INTO ournodeapp.posts (title,body,author,createdDate) VALUES (?,?,?,?)",[incoming.title,incoming.body,incoming.author, incoming.createdDate])
      resolve(insertId)
    } else {
      reject(this.errors)
    }
  })
}

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
      if (post.isVisitorOwner) {
        // actually update the db
        let status = await this.actuallyUpdate()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      const incoming = {
        title: this.data.title,
        body: this.data.body,
        requestedPostId: this.requestedPostId
      }
      /*===============================================
      Task #2 UPDATE AN EXISTING POST
      You'll need: incoming.title, incoming.body, incoming.requestedPostId
      ===============================================*/
      await db.execute("UPDATE posts SET title = ?, body = ? WHERE _id = ?", [incoming.title, incoming.body, incoming.requestedPostId])

      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Post.findSingleById = function (id, visitorId = 0) {
  return new Promise(async function (resolve, reject) {
    /*===============================================
    Task #3 FIND ONE POST BY ID
    You'll need: id
    ===============================================*/
    let [[post]] = await db.execute("SELECT p.title, p.body, p._id, p.author, p.createdDate, u.username, u.avatar FROM posts p JOIN users u ON p.author = u._id WHERE p._id = ?", [id])

    if (post) {
      post.isVisitorOwner = post.author == visitorId
      resolve(post)
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = async function (authorId) {
  /*===============================================
  Task #4 FIND ALL POSTS BY AUTHOR ID
  You'll need: authorId
  ===============================================*/
  let [posts] = await db.execute("SELECT p.title, p.body, p._id, p.author, p.createdDate, u.username, u.avatar FROM posts p JOIN users u ON p.author = u._id WHERE p.author = ? ORDER BY createdDate DESC", [authorId])
  return posts
}

Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    /*===============================================
    Task #5 COUNT HOW MANY POSTS A USER HAS CREATED
    You'll need: id
    ===============================================*/
    const [[{ posts }]] = await db.execute("SELECT count(_id) as posts FROM posts WHERE author = ?", [id])
    
    resolve(posts)
  })
}

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)
      if (post.isVisitorOwner) {
        /*===============================================
        Task #6 DELETE ONE POST BY ID,
        You'll need: postIdToDelete
        ===============================================*/
        await db.execute("DELETE FROM POSTS WHERE _id = ?",[postIdToDelete])
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.search = function (searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == "string") {
      /*===============================================
      Task #7 SEARCH FOR POSTS BY KEYWORD OR PHRASE
      You'll need: searchTerm
      ===============================================*/
      let [posts] = await db.execute()
      resolve(posts)
    } else {
      reject()
    }
  })
}

Post.getFeed = async function (id) {
  /*===============================================
  Task #8 GET POSTS FROM USERS YOU FOLLOW
  You'll need: id
  ===============================================*/
  //let [posts] = await db.execute()

  // Return 'posts' instead of [] once you've actually written your query.
  return []
}

module.exports = Post
