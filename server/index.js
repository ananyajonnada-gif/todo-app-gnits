const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const todoRoutes = require("./routes/todoRoutes");

const app = express();
app.use(express.json());

// Log every API request: method, url, status, time taken, and body for writes
app.use("/api", (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const body = ["POST", "PUT"].includes(req.method)
      ? ` ${JSON.stringify(req.body)}`
      : "";
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms${body}`
    );
  });
  next();
});

// API routes
app.use("/api/todos", todoRoutes);

// Serve the React build (used in production)
const buildPath = path.join(__dirname, "../client/dist");
app.use(express.static(buildPath));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5001;
let memoryServer;

const startServer = async () => {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGO_URI is required in production.");
    }
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    console.log("Connected to temporary MongoDB; data resets when the server stops.");
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

const stopServer = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
};

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);

startServer().catch((err) => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});
