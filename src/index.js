const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
};

const app = express();
app.use(express.json());
app.use(cors());

app.get("/models", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [data] = await con.execute(`SELECT * FROM models`);
    if (data.length === 0) {
      return res.send("There are no models");
    }
    con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

//CIA DAR REIKIA PABAIGTI
app.get("/modelscount", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [data] = await con.execute(
      `
        SELECT vehicle.id, name, hour_price, COUNT(vehicles.model_id) as quantity
        FROM models
        INNER JOIN vehicles ON vehicles.model_id = models.id
        GROUP BY id
      `
    );

    if (data.length === 0) {
      return res.send({ status: "No models or vehicles added" });
    }
    con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

app.get("/vehicles", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [data] = await con.execute(
      `
            SELECT vehicles.id, models.name, number_plate, country_location, ROUND(models.hour_price + models.hour_price*0.21, 2) AS hour_price
            FROM vehicles
            INNER JOIN models ON models.id = vehicles.model_id
            GROUP BY id
            `
    );

    if (data.length === 0) {
      return res.send({ status: "No models or vehicles added" });
    }
    con.end();

    return res.send(data);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

app.get("/vehicles/:country", async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [data] = await con.execute(
      `SELECT * FROM vehicles WHERE country_location = '${req.params.country}' `
    );
    con.end();

    res.send(data);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

app.post("/models", async (req, res) => {
  if (!req.body.name || !req.body.hour_price) {
    return res.status(400).send({ error: "Incorrect data has been passed" });
  }
  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [result] = await con.execute(
      `INSERT INTO models (name, hour_price)
       VALUES
       (${mysql.escape(req.body.name)}, ${mysql.escape(req.body.hour_price)})`
    );

    if (!result.insertId) {
      return res
        .status(500)
        .send({ error: "Execution failed. Please contact admin" });
    }

    con.end();

    return res.send({ status: "OK, model added" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

app.post("/vehicles", async (req, res) => {
  if (
    !req.body.model_id ||
    !req.body.number_plate ||
    !req.body.country_location
  ) {
    return res.status(400).send({ error: "Incorrect data has been passed" });
  }

  try {
    const con = await mysql.createConnection(mysqlConfig);

    const [result] = await con.execute(
      `INSERT INTO vehicles (model_id, number_plate, country_location)
       VALUES
       (${mysql.escape(req.body.model_id)}, ${mysql.escape(
        req.body.number_plate
      )}, ${mysql.escape(req.body.country_location)})
       `
    );
    con.end();

    if (!result.insertId) {
      return res
        .status(500)
        .send({ error: "Execution failed. Please contact admin" });
    }

    return res.send({ status: "OK, vehicle added" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ error: "An unexpected error occured. Please try again later" });
  }
});

app.all("*", (req, res) => {
  res.status(404).send({ error: "Page not found" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on ${port}`));
