const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const getRandomValues = require("get-random-values");
require("dotenv").config();

const httpMethodAndRouteLogs = false;
const requestBodyLogs = false;
const responseLogs = false;
const requestingAndPushingUserLogs = false;
const optionalParamsLogs = false;

const users = [];

// Returns a random hexadecimal string to be used as ID.
const getHexId = () => {
  let byteArray = new Uint8Array(12);
  byteArray = getRandomValues(byteArray);

  const hexStringId = Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hexStringId;
};

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

/**
 * =================================================================
 *                        GET REQUESTS
 * =================================================================
 */

app.get("/api/users", (req, res) => {
  httpMethodAndRouteLogs &&
    console.log(`--- GET --- app.get("/api/users", ...`);

  responseLogs && console.log(`------------------RESPONSE-------------------`);
  // Return users array
  console.log(users);
  res.json(users);
});

app.get("/api/users/:_id/logs", (req, res) => {
  httpMethodAndRouteLogs &&
    console.log(`--- GET --- app.get("/api/users/:_id/logs", ...`);

  const from = req.query.from;
  const to = req.query.to;
  const limit = +req.query.limit;
  optionalParamsLogs &&
    console.log(`Logging optional parameters: ${from} - ${to} - ${limit}`);

  // Return user object with a count property and
  // log array of all exercises added
  //
  // Here always return from the users object, as user has to
  // be already existing
  const requestId = req.params._id;

  if (requestingAndPushingUserLogs) {
    console.log(`Requesting recently created used with exercises...`);
    console.log("Current users array...");
    console.log(users);
  }

  // Get the users array.
  // Find the object that represents the user by the id
  const user = users.find((user) => user._id === requestId);

  if (user) {
    // Add to the user obj all fields relating to exercises
    // Add the count field with a value of 1
    user.count = 1;

    // Add the log field if it does not exists
    user.log = user.log || [];
    let logToReturn = user.log;

    // Return exercises on the log depending on optional params
    if (from) {
      const fromDate = new Date(from);
      console.log(`fromDate: ${fromDate}`);
      logToReturn = user.log.filter((exe) => {
        console.log(`Dates to compare: ${new Date(exe.date)} >= ${fromDate}`);
        console.log(`Dates to return ${new Date(exe.date) >= fromDate}`);
        return new Date(exe.date) >= fromDate;
      });
    }
    if (to) {
      const toDate = new Date(to);
      console.log(`toDate: ${toDate}`);
      logToReturn = user.log.filter((exe) => {
        console.log(`Dates to compare: ${new Date(exe.date)} <= ${toDate}`);
        console.log(`Dates to return ${new Date(exe.date) <= toDate}`);
        return new Date(exe.date) <= toDate;
      });
    }
    if (limit) {
      console.log(`limit: ${limit}`);
      logToReturn = user.log.slice(0, limit);
    }

    // Now use those user fields to populate the respObj
    // Don't use the values from the req obj.

    const respObj = {
      _id: user._id,
      username: user.username,
      count: user.count,
      log: logToReturn,
    };
  } else {
    const respObj = {
      message: "User not found!",
    };
  }

  if (responseLogs) {
    console.log(`------------------RESPONSE-------------------`);
    console.log(respObj);
  }
  res.json(respObj);
});

/**
 * =================================================================
 *                        POST REQUESTS
 * =================================================================
 */

app.post("/api/users", (req, res) => {
  httpMethodAndRouteLogs &&
    console.log(`--- POST --- On app.post("/api/users", ...`);

  requestBodyLogs && console.log(req.body);
  // Create user object
  const user = {
    username: req.body.username,
    _id: getHexId(),
  };
  users.push(user);

  if (responseLogs) {
    console.log(`------------------RESPONSE-------------------`);
    console.log(user);
  }

  res.json(user);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  httpMethodAndRouteLogs &&
    console.log(`--- POST --- On app.post("/api/users/:_id/exercises", ...`);

  requestBodyLogs && console.log(req.body);
  // Return user object with a count property and
  // log array of all exercises added
  //
  // Here always return from the users object, as user has to
  // be already existing
  const requestId = req.params._id;

  // Get the users array.
  // Find the object that represents the user by the id
  const user = users.find((user) => user._id === requestId);

  if (user) {
    // Add to the user obj all fields relating to exercises
    // Add the count field with a value of 1
    user.count = 1;

    // Add the log field as an array
    user.log = [];

    // Create an exercise data obj using date, description and duration
    const exercise = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    };

    // Push exercise to log array
    user.log.push(exercise);

    if (requestingAndPushingUserLogs) {
      console.log(`Pushing recently created used with exercises...`);
      console.log(`Current users array...`);
      console.log(users);
    }

    // Now use those user fields to populate the respObj
    // Don't use the values from the req obj.

    const respObj = {
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
    };
  } else {
    const respObj = {
      message: "User not found!",
    };
  }

  if (responseLogs) {
    console.log(`------------------RESPONSE-------------------`);
    console.log(respObj);
  }

  res.json(respObj);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
