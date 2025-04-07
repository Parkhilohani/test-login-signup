const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { connectToDb, ContentModel } = require("./src/config");
const User = require("./models/User"); 

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, JS, images, etc.)
console.log("Setting up static files...");
app.use(express.static(path.join(__dirname, "../frontend")));

// Connect to the database
connectToDb();

// Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/login.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/signup.html'));
});
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/home.html'));
});
//check unique email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Signup Route
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body; 

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

   //Check email format
   if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" })
   }

   // Check password length (should be exactly 5 characters)
   if (password.length !== 5) {
    return res.status(400).json({ error: 'Password must be exactly 5 characters long' });
   }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists. Please use different email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.redirect("/home");
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({
      $or: [{ name: username }, { email: username }], 
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.redirect("/home");
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on http://localhost: ${port}`);
});
