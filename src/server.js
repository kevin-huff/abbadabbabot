import { settings_db, sched_db } from "./database.js";
import express from "express";
import basicAuth from "express-basic-auth";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from "socket.io";
import { abbadabbabotSay, sendMessageToChannel } from "./openAI.js";

const app = express();

const port = 3000;
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Replace __dirname with a dynamic path based on the current module file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
var dir = path.join(__dirname, "public");

app.use(express.static(path.resolve(__dirname, 'public')));
// Middleware to parse JSON bodies
app.use(express.json());
app.set("view engine", "ejs");


app.get("/sched", (req, res) => {
  res.render("sched.ejs", {});
});
app.get(
  "/api/schedule",
  basicAuth({
    users: { [process.env.sched_user]: process.env.sched_pass },
    challenge: true,
  }),
  function (req, res) {
    let schedulesObject = sched_db.all();

    const currentTime = new Date().getTime();
    let upcomingSchedules = [];

    // Loop through the object keys (timestamps)
    for (const timestamp in schedulesObject) {
      // Filter out schedules with timestamps that are in the future
      if (Number(timestamp) > currentTime) {
        // Add each schedule in the array to the upcomingSchedules array
        upcomingSchedules = upcomingSchedules.concat(
          schedulesObject[timestamp]
        );
      }
    }

    // Sort the upcomingSchedules array by timestamp
    upcomingSchedules.sort((a, b) => a.timestamp - b.timestamp);

    res.json(upcomingSchedules);
  }
);

// POST endpoint to add a new schedule
app.post("/api/schedule", async (req, res) => {
  const { dateTime, prompt } = req.body;
  const timestamp = new Date(dateTime).getTime();
  const generatedResponse = await abbadabbabotSay(prompt, "", "");
  const newSchedule = { prompt, generatedResponse, timestamp };
  sched_db.push(timestamp, {
    prompt: prompt,
    generatedResponse: generatedResponse,
    timestamp: timestamp,
  });
  res.json(newSchedule);
});

// POST endpoint to edit an existing schedule
app.post("/api/schedule/edit", async (req, res) => {
  const { originalTimestamp, newTimestamp, newPrompt } = req.body;

  if (newTimestamp !== originalTimestamp) {
    sched_db.delete(String(originalTimestamp));
  }

  const generatedResponse = await abbadabbabotSay(newPrompt, "", "");
  const newSchedule = {
    prompt: newPrompt,
    generatedResponse,
    timestamp: newTimestamp,
  };
  console.log(newSchedule);
  try {
    sched_db.set(String(newTimestamp), newSchedule);
    res.json(newSchedule);
  } catch (error) {
    console.error("Error in sched_db.set:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// DELETE endpoint to remove an existing schedule
app.delete("/api/schedule/delete/:timestamp", (req, res) => {
  const { timestamp } = req.params;
  console.log("timestamp", timestamp);
  try {
    sched_db.delete(String(timestamp));
    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error in sched_db.delete:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/leaderboard", (req, res) => {
  res.render("leaderboard");
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("new_checkin", (username) => {
    console.log("new checkin: " + username);
    io.emit("update_leaderboard");
  });

  socket.on("missed_checkin", (username) => {
    console.log("missed checkin: " + username);
    io.emit("update_leaderboard");
  });
});
export default app;