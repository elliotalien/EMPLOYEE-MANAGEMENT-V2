const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    salutation: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      select: true, 
    },
    dob: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    qualifications: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pinZip: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      default: 'General'
    },
    previousDepartment: {
      type: String,
      default: null
    },
    departmentChangeDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active'
    },
    salary: {
      type: Number,
      required: true,
      default: 0
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true } 
);

// Drop existing indexes when the model is compiled
employeeSchema.pre('save', async function(next) {
  try {
    if (!this.collection.collectionName) {
      return next();
    }
    
    // Drop any existing unique indexes
    await this.collection.dropIndexes();
    next();
  } catch (error) {
    next(error);
  }
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
