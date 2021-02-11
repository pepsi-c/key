const mongoose = require("mongoose");

const keyinfoSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  timecreated: {
    type: Number,
    required: true,
    default: -1,
  },
  key: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  abauth: {
    type: String,
    required: false,
    default: "",
  },
});

module.exports = mongoose.model("keyinfo", keyinfoSchema);
