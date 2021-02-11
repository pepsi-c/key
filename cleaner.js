// It's not a good idea to have flooded DBs

const mongoose = require("mongoose");
const keyinfo = require("./models/keyinfo");
const { CLUSTER, BASE, ID, TIMEWAIT, DURATION } = require("./config.json");

mongoose.connect(CLUSTER, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  setInterval(async () => {
    console.log("Alright!");
    keyinfo.find({}, (err, users) => {
      if (err) console.error(err);

      users.forEach(user => {
        if ((Date.now() - user.timecreated) > Number(DURATION) * 3600000) {
          keyinfo.deleteOne({ _id: user._id }, (err) => {
            console.error(err);
          });
        }
      })
    })
  }, 3600000) // repeat every hour
});

