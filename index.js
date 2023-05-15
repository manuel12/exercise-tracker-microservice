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

const logHttpMethodAndRoute = (msg) => {
  httpMethodAndRouteLogs && console.log(msg);
};

const logResponse = (respObj = null) => {
  if (responseLogs) {
    console.log("------------------RESPONSE-------------------");
    if (respObj) {
      console.log(respObj);
    }
  }
};

const users = [];
const exercises = [];

// Returns a random hexadecimal string to be used as ID.
const getHexId = () => {
  let byteArray = new Uint8Array(12);
  byteArray = getRandomValues(byteArray);

  const hexStringId = Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hexStringId;
};

const getUserById = (id) => {
  return users.find((user) => user._id === id);
};

const getExerciseById = (id) => {
  return exercises.filter((exercise) => exercise._id === id);
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
  logHttpMethodAndRoute(`--- GET --- app.get("/api/users", ...`);

  logResponse(users);

  res.json(users);
});

app.get("/api/users/:id/logs", (req, res) => {
  logHttpMethodAndRoute(`--- GET --- app.get("/api/users/:_id/logs", ...`);

  console.log(req.query);

  let respObj = {};

  const id = req.params.id;
  const fromStr = req.query.from;
  const toStr = req.query.to;
  const limitStr = +req.query.limit;

  optionalParamsLogs &&
    console.log(`Logging optional parameters: ${from} - ${to} - ${limit}`);

  if (requestingAndPushingUserLogs) {
    console.log(`Requesting recently created used with exercises...`);
    console.log("Current users array...");
    console.log(users);
  }

  let fromDate;
  let toDate;

  // Return exercises on the log depending on optional params
  if (fromStr) {
    fromDate = new Date(fromStr);

    if (fromDate === "Invalid Date") {
      fromDate = false;
    }
  }
  if (toStr) {
    toDate = new Date(toStr);

    if (toDate == "Invalid Date") {
      // //CHANGE!!!
      // res.status(400).send("Query `to` is not a valid date.");
      // console.log("Log request failed: " + id + " to: " + toStr);
      // return;
      toDate = false;
    }
  }

  if (limitStr && isNaN(parseInt(limitStr))) {
    // // CHANGE!!!
    // res.status(400).send("Query `limit` is not number.");
    // console.log("Log request failed: " + id + " limit: " + limitStr);
    // return;
    limitStr = false;
  }

  // Get user by id.
  const user = getUserById(id);
  if (user) {
    // Get exercises by id.
    let exercises = getExerciseById(id);
    console.log(`Exercises found for id ${id}: `, exercises);

    // Apply from, to and limits to slice exercises array.

    if (fromDate) {
      // Filter exercises where the exercise date is > than fromDate.
      exercises = exercises.filter(
        (exercise) => new Date(fromDate) < new Date(exercise.date)
      );
      console.log("Filtered exercises", exercises);
    }

    if (toDate) {
      // Filter exercises where the toDate > exercise date.
      exercises = exercises.filter(
        (exercise) => new Date(toDate) > new Date(exercise.date)
      );
      console.log("Filtered exercises", exercises);
    }

    if (limitStr) {
      exercises = exercises.slice(0, limitStr);
    }

    respObj = {
      username: user.username,
      count: exercises.length,
      _id: id,
      log: exercises,
    };
  } else {
    respObj = {
      message: "User not found!",
    };
  }

  logResponse(respObj);

  res.json(respObj);
});

/**
 * =================================================================
 *                        POST REQUESTS
 * =================================================================
 */

app.post("/api/users", (req, res) => {
  logHttpMethodAndRoute(`--- POST --- On app.post("/api/users", ...`);

  requestBodyLogs && console.log(req.body);

  const username = req.body.username;
  if (username !== "") {
    // Create user object
    const user = {
      username: req.body.username,
      _id: getHexId(),
    };
    // console.log("Created user: ", user);
    users.push(user);
    // console.log("Users", users);

    logResponse(user);

    res.json(user);
  }
});

app.post("/api/users/:_id/exercises", (req, res) => {
  logHttpMethodAndRoute(
    `--- POST --- On app.post("/api/users/:_id/exercises", ...`
  );

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

    const descriptionStr = req.body.description;
    const durationStr = req.body.duration;
    const dateStr = req.body.date;

    if (descriptionStr == "") {
      res.json(
        (respObj = {
          message: "Description is required!",
        })
      );
    }

    if (durationStr == "") {
      res.json(
        (respObj = {
          message: "Duration is required!",
        })
      );
    }

    if (isNaN(durationStr)) {
      res.json(
        (respObj = {
          message: "Duration is not a number!",
        })
      );
    }

    let date;

    if (dateStr == "" || dateStr == undefined) {
      date = new Date().toDateString();
    } else {
      date = new Date(dateStr).toDateString();
    }

    // Create an exercise data obj using date, description and duration
    const exercise = {
      _id: user._id,
      username: user.username,
      description: descriptionStr,
      duration: Number(durationStr),
      date: date,
    };

    // Push exercise to log array
    user.log.push(exercise);

    // Push exercises to the exercises array.
    exercises.push(exercise);
    // console.log("Created exercise", exercise);

    if (requestingAndPushingUserLogs) {
      console.log(`Pushing recently created user with exercises...`);
      console.log(`Current users array...`);
      console.log(users);
    }

    // Now use exercise as the respObj
    respObj = exercise;
  } else {
    respObj = {
      message: "User not found!",
    };
  }

  logResponse(respObj);

  res.json(respObj);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
