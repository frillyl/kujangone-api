import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import rateLimit from "./middlewares/rateLimit.js";
import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import anggota from "./routes/anggota.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit);

app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        credentials: true,
    })
);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected...")).catch((err) => {
    console.error("MongoDB connection error: ", err);
    process.exit(1);
});

app.use("/api/auth", auth);
app.use("/api/admin", admin);
app.use("/api/master/anggota", anggota);

app.get("/", (req, res) => res.send("API running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));