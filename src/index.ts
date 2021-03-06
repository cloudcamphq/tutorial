import fs from "fs";
import path from "path";
import express from "express";
import Handlebars from "handlebars";
import { Pool, QueryResult } from "pg";

let connectionPool: Pool | undefined = undefined;
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
  let visitsCount = await getVisitsCount(next);
  res.send(indexTemplate({ visitsCount }));
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

async function qasync(
  next: any,
  query: string,
  values: any[] = []
): Promise<QueryResult<any>> {
  return new Promise<QueryResult<any>>((resolve, reject) => {
    connectionPool.query(query, values, (err, res) => {
      if (err) {
        return next(err);
      }
      resolve(res);
    });
  });
}

async function getVisitsCount(next: any): Promise<number | undefined> {
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
