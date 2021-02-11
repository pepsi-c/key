// A simple key system in nodejs
// #nodegang
const express = require("express");
const ejs = require("ejs");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const keyinfo = require("./models/keyinfo");
const app = express();
const { CLUSTER, BASE, ID, TIMEWAIT } = require("./config.json");
const { response } = require("express");
// https://github.com/FutureStunt/linkvertise
function btoa(str) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), "binary");
  }
  return buffer.toString("base64");
}

function linkvertise(userid, link) {
  var base_url = `https://link-to.net/${userid}/${Math.random() * 1000
    }/dynamic`;
  var href = base_url + "?r=" + btoa(encodeURI(link));
  return href;
}
function randint(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
function makeKey() {
  let ri = "";
  for (let i = 0; i < randint(25, 35); i++) {
    ri += String.fromCharCode(randint(65, 90));
  }
  return ri;
}
async function getClientIp(req) {
  return await (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    ""
  )
    .split(",")[0]
    .trim();
}
async function genKey(req) {
  let theip = await getClientIp(req);
  let exp = await keyinfo.find({ ip: theip });
  if (exp.length > 1) {
    await keyinfo.deleteMany({ ip: theip }, (err) => {
      if (err) console.error(err);
    });
  }
  // generate a new one
  await keyinfo.create({
    abauth: "",
    ip: theip,
    timecreated: -1,
    key: makeKey(),
  });
  return "Key created";
}

mongoose.connect(CLUSTER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

require("./cleaner");
app.disable("x-powered-by"); // if there is a 0 day exploit for express we dont want them to know we use express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.get("/", async (req, res) => {
  res.redirect("/genkey");
});
app.get("/genkey", async (req, res) => {
  // thx stackoverflow :heart: https://stackoverflow.com/questions/10849687/express-js-how-to-get-remote-client-address
  // remove old ones
  await genKey(req);
  res.redirect("/keysys");
});
app.get("/keysys", async (req, res) => {
  /*
  Plan:
  make it go to a linkvertise that goes to keydone
  update the db for that particular ip
  yes, it will be problematic if you have multiple ips for the same thing, but it is what it is
  tell them not to use a vpn
  */
  try {
    let thekey = await keyinfo.findOne({ ip: await getClientIp(req) });
    let exp = await keyinfo.find({ ip: await getClientIp(req) });
    if (exp.length < 1) {
      console.log(keysl + " is smaller than 1");
      return res.render("nokeygen");
    }
    thekey.timecreated = Date.now();
    let abauth = makeKey();
    thekey.abauth = abauth;
    thekey.save();
    let lvtid = 111273;
  //  let reurl = "https://droprblx.herokuapp.com";
    let reurl = "http://localhost:3000";
    res.redirect(linkvertise(parseInt(ID), BASE + "/keydone/" + abauth));
  } catch (err) {
    console.error(err);
    res.render("nokeygen");
  }
  // console.log(thekey);
});
app.get("/keydone/:abauth", async (req, res) => {
  // code for keydone
  let current = Date.now();
  try {
    let thekey = await keyinfo.findOne({ ip: await getClientIp(req) });
    if (req.params.abauth !== thekey.abauth || thekey.abauth === "")
      return res.render("bypass");
    console.log("Time created: " + thekey.timecreated);
    if (thekey.timecreated === -1) {
      return res.render("nokeygen");
    }
    console.log(
      `Time (in seconds) spent on the key system: ${(current - thekey.timecreated) / 1000
      }`
    );
    if (
      current - thekey.timecreated > parseInt(TIMEWAIT) * 1000 &&
      !thekey.completed
    ) {
      res.render("key", { key: thekey.key });
      thekey.completed = true;
      thekey.save();
    } else {
      if (thekey.completed) {
        res.render("completed", { key: thekey.key });
      } else {
        res.render("bypass");
      }
    }
  } catch (err) {
    console.log("dgfgfgfd");
    console.error(err);
    res.render("nokeygen");
  }
});
app.post("/iskeyvalid", async (req, res) => {
  // code for iskeyvalid
  // used by the client
  let key = req.body.key;
  console.log("The key is: " + key);
  let thekey = await keyinfo.findOne({ ip: await getClientIp(req) });
  if (!thekey) return res.send(false);
  let isCompleted = (key === thekey.key) && thekey.completed;
  if (isCompleted && Date.now() - thekey.timecreated > 3600000) {
    isCompleted = false;
    keyinfo.deleteOne({ _id: thekey._id }, (err) => {
      console.error(err);
    });
  }
  res.send(isCompleted);
});
app.listen(process.env.PORT || 3000, async (req, res) =>
  console.log("Server up")
);
