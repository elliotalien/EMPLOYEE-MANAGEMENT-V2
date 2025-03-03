const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./src/config/dbConfig");
const cookieParser = require("cookie-parser");
const User = require("./src/model/user.model");
const flash = require("express-flash");

dotenv.config();
const app = express();

// Connect to database
connectDB();

// Cookie Parser
app.use(cookieParser());

// Session Middleware with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Flash messages middleware
app.use(flash());

// Set EJS as templating engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve CSS with proper content type
app.use(
  "/css",
  express.static(path.join(__dirname, "assets/css"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

// Logging Middleware
app.use(morgan("tiny"));

// Route Imports
const authRouter = require("./src/routes/auth.routes");
const userRouter = require("./src/routes/user.routes");
const employeeRouter = require("./src/routes/employee.routes");
const webRouter = require("./src/routes/web.routes");

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/employees", employeeRouter);
app.use("/", webRouter);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error: ", err.message);
  res.status(500).render("error", {
    title: "Error",
    message: "Something went wrong!",
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`📌 Server Connected`);
  console.log(`🌐 Running on http://localhost:${PORT}`);
});