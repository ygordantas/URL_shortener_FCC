require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const isUrl = require("is-url");
const _ = require("lodash");
require("./models/Url");

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//--

// DB set up
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true }
);
const Url = mongoose.model("Url");
//--
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl/new", (req, res) => {
  if (isUrl(req.body.url)) {
    //Check if is a valid url
    const paths = req.body.url
      .replace(/^((http)s?:\/\/(www.)?)/i, "")
      .split("/");
    const hostname = paths.shift();
    dns.lookup(hostname, async err => {
      // check if the hostname is valid
      if (!err) {
        let urlDoc = await Url.findOne({
          original_url: req.body.url
        });
        // check if you already have the url in the database
        if (!urlDoc) {
          // if there is no register of the url in the database create a new document
          const short_url = await Url.estimatedDocumentCount();
          urlDoc = await new Url({
            original_url: req.body.url,
            short_url
          }).save();
          res.send(_.pick(urlDoc, ["original_url", "short_url"]));
        } else {
          res.send(_.pick(urlDoc, ["original_url", "short_url"]));
        }
      } else {
        res.send({ error: "Invalid Hostname" });
      }
    });
  } else {
    res.send({ error: "Invalid URL" });
  }
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  let urlDoc = await Url.findOne({ short_url: req.params.short_url });
  if (urlDoc) {
    res.redirect(urlDoc.original_url);
  } else {
    res.send({
      error:
        "Sorry, we were unable to find the short url provided on our database. Make sure you create the short url document first!"
    });
  }
});

app.get("*", (req, res) => {
  res.redirect("/");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
