const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/user");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API,
    },
  })
);

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ msg: "Please enter a valid email and password." });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).json({ msg: "Invalid email or password." });
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id.toString(),
              },
              "your_secret_key", // Consider using an environment variable for your secret
              { expiresIn: "3h" }
            );

            // Set the token as a cookie if needed; otherwise, return it in the response
            res.cookie("token", token, { maxAge: 3600000, httpOnly: true });

            // Send a success response with the token
            return res.status(200).json({
              message: "Login successful",
              token: token,
              userId: user._id.toString(), // You can include other user details as needed
            });
          }

          return res.status(422).json({ msg: "Invalid email or password." });
        })
        .catch((err) => {
          console.log(err);
          return res
            .status(500)
            .json({ msg: "An error occurred. Please try again." });
        });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ msg: "An error occurred. Please try again." });
    });
};

exports.postSignup = async (req, res, next) => {
  const {
    userName,
    fName,
    lName,
    companyName,
    birthday,
    gender,
    email,
    mobile,
    password,
    confirmPassword,
  } = req.body;

  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user instance
    const user = new User({
      userName,
      firstName: fName,
      lastName: lName,
      birthDay: birthday,
      companyName,
      gender,
      email,
      phoneNumber: mobile,
      password: hashedPassword,
      cart: { items: [] },
    });

    // Save the user to the database
    await user.save();

    // Send response
    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: {
        userName,
        firstName: fName,
        lastName: lName,
        email,
        // You can include other user data as needed
      },
    });

    // Uncomment to send a confirmation email
    // await transporter.sendMail({
    //   to: email,
    //   from: 'shop@node-complete.com',
    //   subject: 'Signup succeeded!',
    //   html: '<h1>You successfully signed up!</h1>',
    // });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.postLogout = (req, res, next) => {
  res.clearCookie("token").redirect("/");
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        const token = jwt.sign(
          { email: req.body.email, userId: result._id.toString() },
          "your_secret_key",
          { expiresIn: "1h" }
        );
        res.redirect("/");
        transporter.sendMail({
          to: req.body.email,
          from: "shop@node-complete.com",
          subject: "Password reset",
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:2500/reset/${token}">link</a> to set a new password.</p>
          `,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

// exports.postReset = (req, res, next) => {
//   crypto.randomBytes(32, (err, buffer) => {
//     if (err) {
//       console.log(err);
//       return res.redirect('/reset');
//     }
//     const token = buffer.toString('hex');
//     User.findOne({ email: req.body.email })
//       .then(user => {
//         if (!user) {
//           req.flash('error', 'No account with that email found.');
//           return res.redirect('/reset');
//         }
//         user.resetToken = token;
//         user.resetTokenExpiration = Date.now() + 3600000;
//         return user.save();
//       })
//       .then(result => {
//         res.redirect('/');
//         transporter.sendMail({
//           to: req.body.email,
//           from: 'shop@node-complete.com',
//           subject: 'Password reset',
//           html: `
//             <p>You requested a password reset</p>
//             <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
//           `
//         });
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   });
// };

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid or expired reset token.");
        return res.redirect("/reset");
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: req.flash("error"),
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  // Verify the JWT token
  jwt.verify(passwordToken, "your_secret_key", (err, decodedToken) => {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    }
    const userId = decodedToken.userId;
    User.findById(userId)
      .then((user) => {
        if (!user) {
          console.log("User not found");
          return res.redirect("/login");
        }
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
      })
      .then((hashedPassword) => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
      })
      .then((result) => {
        res.redirect("/login");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};
