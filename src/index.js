const fs = require("fs");
const path = require("path");
const express = require("express");
const Handlebars = require("handlebars");
const { Pool } = require("pg");

let connectionPool = undefined;
let connectionString = process.env["DATABASE_URL"];

if (connectionString) {
  connectionPool = new Pool({
    connectionString,
  });
}

const app = express();
const port = 8080;

// render the index page
app.get("/", async (req, res, next) => {
  const indexTemplate = Handlebars.compile(
    fs.readFileSync("templates/index.html").toString("utf-8")
  );
  let visitsCounter = await getVisitsCounter(next);
  res.send(indexTemplate({ visitsCounter }));
});

app.get("/img/logo.svg", (req, res) => {
  res.sendFile(path.join("img", "logo.svg"), {
    root: path.join(__dirname, "..", "static"),
  });
});

// causes 500 internal server error
app.get("/error", (req, res) => {
  throw new Error("Boom!");
});

// start the express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

async function qasync(next, query, values = []) {
  return new Promise((resolve, reject) => {
    connectionPool.query(query, values, (err, res) => {
      if (err) {
        return next(err);
      }
      resolve(res);
    });
  });
}

async function getVisitsCounter(next) {
  if (connectionPool) {
    await qasync(
      next,
      "CREATE TABLE IF NOT EXISTS visits_counter AS SELECT 0 as visits_count;"
    );
    await qasync(
      next,
      "UPDATE visits_counter SET visits_count = visits_count + 1;"
    );
    let result = await qasync(next, "SELECT visits_count FROM visits_counter");
    return result.rows[0].visits_count;
  } else {
    return undefined;
  }
}
