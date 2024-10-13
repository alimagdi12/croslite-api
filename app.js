const path = require("path");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const errorController = require("./controllers/error");
const User = require("./models/user");
const port = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const cors = require("cors");

const app = express();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const corsOptions = {
  origin: "http://localhost:5173", // Allow this origin to access your server
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow these HTTP methods
  credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    console.log("database connected");
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
