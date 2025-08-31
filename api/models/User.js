const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'sales'],
    default: 'sales'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Microsoft OAuth2 specific fields
  microsoftId: {
    type: String,
    unique: true,
    sparse: true
  },
  tenantId: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find or create user from Microsoft OAuth2 data
userSchema.statics.findOrCreateFromMicrosoft = async function(microsoftProfile) {
  try {
    let user = await this.findOne({ 
      $or: [
        { email: microsoftProfile.mail || microsoftProfile.userPrincipalName },
        { microsoftId: microsoftProfile.id }
      ]
    });

    if (user) {
      // Update existing user with Microsoft data
      user.microsoftId = microsoftProfile.id;
      user.tenantId = microsoftProfile.tenantId;
      user.lastLogin = new Date();
      if (microsoftProfile.displayName) user.displayName = microsoftProfile.displayName;
      await user.save();
    } else {
      // Check if user exists by email (for existing users without Microsoft integration)
      user = await this.findOne({ 
        email: microsoftProfile.mail || microsoftProfile.userPrincipalName 
      });
      
      if (user) {
        // Link existing user to Microsoft account
        user.microsoftId = microsoftProfile.id;
        user.tenantId = microsoftProfile.tenantId;
        user.lastLogin = new Date();
        if (microsoftProfile.displayName) user.displayName = microsoftProfile.displayName;
        await user.save();
      } else {
        // User doesn't exist - this should not happen in this system
        // Only allow login for pre-existing users
        return null;
      }
    }

    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
