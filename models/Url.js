const mongoose = require("mongoose");
const { Schema } = mongoose;

const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

mongoose.model("Url", urlSchema);
