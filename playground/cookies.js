const express = require("express");
const session = require("express-session");
const app = express();
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.get("/", (req, res) => {
  req.session.lol = 22;
  res.send("Hello Playground");
});

app.listen(3000, () => console.log("server up"));
