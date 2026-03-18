import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcrypt'; // Used in login (comparePassword) and changePassword

// Register User
export const register = async(req, res) => {
    try {
        const { name, email, password, location } = req.body;

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }

        // check if its the first user (must be admin)
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;

        const user = new User({
            name,
            email,
            password,
            location,
            isAdmin: isFirstUser
        });

        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                location: user.location,
                isAdmin: user.isAdmin,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        console.error('Error registering user');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ 
                success: false,
                message: 'Account is banned', 
                reason: user.banReason 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Update last active
        user.lastActive = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          message: 'Login successful',
          token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                location: user.location,
                isAdmin: user.isAdmin,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        console.error('Error logging in');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ 
                success: true,
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return res.json({ 
            success: true,
            message: 'Password updated successfully' 
        });
    } catch (error) {
        console.error('Error changing password');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// My Profile
export const profile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}