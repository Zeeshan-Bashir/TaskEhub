






const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
try {
  mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://zeeshanbashirmir:bOcqlygvti2mycqi@cluster0.vxlg5.mongodb.net/todoApp?retryWrites=true&w=majority&appName=Cluster0');
  console.log("Connected to the database...");
} catch (e) {
  console.log(e);
}

// Task schema and model
const taskSchema = new mongoose.Schema({
  name: String,
  date: String,
  category: String,
  time: String,
  priority: String,
  description: String,
  color: String,
  completed: Boolean,
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Link task to user
});

const Task = mongoose.model("Task", taskSchema);

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from 'Bearer <token>'
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // Attach user payload to request
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
}

// User Registration
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Secured Task API Endpoints
app.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }); // Fetch tasks for logged-in user
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

app.post("/tasks", authenticateToken, async (req, res) => {
  try {
    const newTask = new Task({ ...req.body, userId: req.user.id }); // Link task to user
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Failed to create task" });
  }
});

app.put("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // Ensure task belongs to user
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to update task" });
  }
});

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id }); // Ensure task belongs to user
    if (!task) {
      return res.status(404).json({ message: "Task not found or not authorized" });
    }
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at PORT: ${port}`);
});




