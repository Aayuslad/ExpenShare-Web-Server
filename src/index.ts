// Basic Imports
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Express } from "express";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import cron from "node-cron";
import path from "path";
// File Imports
import { userRouter, transactionRouter } from "./routes/router";

// Creating Backend Application
const app: Express = express();

// Middlewares
app.use(
  cors({
    origin: "https://expenshare.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view-engine", "ejs");
app.set("views", path.resolve("./views"));

// Routes
app.use("/user", userRouter);
app.use("/transaction", transactionRouter);

// Database Cleanup
cron.schedule(
  "0 * * * *",
  async () => {
    console.log("Running Database cleanup job...");
    try {
      const client = await MongoClient.connect(process.env.DB_URL!);
      const db = client.db();
      const otpCollection = db.collection("otps");
      const userDataCollection = db.collection("userdatas");
      const now = new Date();

      await otpCollection.deleteMany({ expires: { $lt: now } });
      await userDataCollection.deleteMany({ expires: { $lt: now } });
      console.log("Expired Colections cleared successfully.");
      client.close();
    } catch (error) {
      console.error("Error clearing Expired Collection:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// DB Connection
const PORT: number = 8080 | Number(process.env.PORT);
const DB_URL: string = String(process.env.DB_URL);

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log("Server Started");
    });
  })
  .catch((err) => {
    console.log(err);
  });
