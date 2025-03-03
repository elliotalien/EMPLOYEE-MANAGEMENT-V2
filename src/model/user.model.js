const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: ""
    },
    profileImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      trim: true
    },
    otpExpiry: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
