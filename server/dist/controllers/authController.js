"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.uploadAvatar = exports.updateProfile = exports.registerStaff = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.googleLogin = exports.login = exports.resendOtp = exports.verifyOtp = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinary_1 = require("cloudinary");
const User_js_1 = require("../models/User.js");
const Customer_js_1 = require("../models/Customer.js");
const Staff_js_1 = require("../models/Staff.js");
const auditLogger_js_1 = require("../middleware/auditLogger.js");
const emailService_js_1 = require("../services/emailService.js");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'durfn3vvo',
    api_key: process.env.CLOUDINARY_API_KEY || '228161363588349',
    api_secret: process.env.CLOUDINARY_API_SECRET || '1mJm_UrApEjuv14AlEbUHnYIopw',
});
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_subflow_2026', { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
};
// Register Customer with 6-Digit OTP Email Verification
const register = async (req, res) => {
    try {
        const { name, email, password, companyName, phoneNumber, currency, taxId } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        let user = await User_js_1.User.findOne({ email: normalizedEmail });
        // Generate 6-digit numeric OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        if (user) {
            if (user.isEmailVerified) {
                res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists and is verified. Please log in.',
                });
                return;
            }
            // Re-provision unverified user
            user.name = name;
            user.password = password;
            user.phoneNumber = phoneNumber || user.phoneNumber;
            user.verificationOtp = otp;
            user.verificationOtpExpires = otpExpires;
            await user.save();
        }
        else {
            user = await User_js_1.User.create({
                name,
                email: normalizedEmail,
                password,
                role: 'customer',
                phoneNumber: phoneNumber || '',
                isEmailVerified: false,
                verificationOtp: otp,
                verificationOtpExpires: otpExpires,
            });
            const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
            await Customer_js_1.Customer.create({
                user: user._id,
                customerId,
                companyName: companyName || `${name}'s Organization`,
                taxId: taxId || '',
                currency: currency || 'INR',
                referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            });
        }
        // Send OTP via Nodemailer in background (non-blocking, instant response)
        (0, emailService_js_1.sendOtpEmail)(user.email, user.name, otp).catch((err) => {
            console.error('[OTP Email Background Error]', err.message);
        });
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'OTP_SENT',
            entity: 'User',
            entityId: user._id.toString(),
            details: { email: user.email },
            req,
        });
        res.status(200).json({
            success: true,
            requiresOtp: true,
            email: user.email,
            message: `A 6-digit verification code has been dispatched to ${user.email}. Enter it to complete activation.`,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.register = register;
// Verify Registration OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_js_1.User.findOne({ email: normalizedEmail }).select('+verificationOtp +verificationOtpExpires');
        if (!user) {
            res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({ success: false, message: 'This email is already verified. Please sign in.' });
            return;
        }
        if (!user.verificationOtp || user.verificationOtp !== otp.toString().trim()) {
            res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
            return;
        }
        if (!user.verificationOtpExpires || user.verificationOtpExpires < new Date()) {
            res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
            return;
        }
        // Mark verified and clear OTP fields
        user.isEmailVerified = true;
        user.verificationOtp = undefined;
        user.verificationOtpExpires = undefined;
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
        let customer = await Customer_js_1.Customer.findOne({ user: user._id });
        if (!customer && user.role === 'customer') {
            const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
            customer = await Customer_js_1.Customer.create({
                user: user._id,
                customerId,
                companyName: `${user.name}'s Organization`,
                currency: 'INR',
                referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            });
        }
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'USER_REGISTER_VERIFIED',
            entity: 'User',
            entityId: user._id.toString(),
            details: { email: user.email, role: user.role },
            req,
        });
        await (0, emailService_js_1.sendWelcomeEmail)(user.email, user.name, user.role);
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            message: 'Email verified successfully! Welcome to Billflow 2.0.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                status: user.status,
            },
            customer: customer
                ? {
                    id: customer._id,
                    customerId: customer.customerId,
                    companyName: customer.companyName,
                    currency: customer.currency,
                }
                : null,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.verifyOtp = verifyOtp;
// Resend Registration OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email address is required.' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_js_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(404).json({ success: false, message: 'No registered account found with this email.' });
            return;
        }
        if (user.isEmailVerified) {
            res.status(400).json({ success: false, message: 'This email is already verified. Please sign in.' });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOtp = otp;
        user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        // Send OTP via Nodemailer in background (non-blocking, instant response)
        (0, emailService_js_1.sendOtpEmail)(user.email, user.name, otp).catch((err) => {
            console.error('[Resend OTP Email Background Error]', err.message);
        });
        res.json({
            success: true,
            message: `A new 6-digit verification code has been dispatched to ${user.email}.`,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.resendOtp = resendOtp;
// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await (0, auditLogger_js_1.logAudit)({
                action: 'LOGIN_FAILED',
                entity: 'Security',
                details: { email, reason: 'Incorrect password' },
                severity: 'warning',
                req,
            });
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }
        if (user.status !== 'active') {
            res.status(403).json({ success: false, message: `Account is ${user.status}. Please contact support.` });
            return;
        }
        user.lastLogin = new Date();
        user.loginCount += 1;
        user.loginIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        await user.save();
        let customerData = null;
        let staffData = null;
        if (user.role === 'customer') {
            customerData = await Customer_js_1.Customer.findOne({ user: user._id });
        }
        else if (user.role === 'staff') {
            staffData = await Staff_js_1.Staff.findOne({ user: user._id });
        }
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'LOGIN_SUCCESS',
            entity: 'User',
            entityId: user._id.toString(),
            details: { role: user.role, loginCount: user.loginCount },
            req,
        });
        const token = generateToken(user._id.toString(), user.role);
        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                status: user.status,
            },
            customer: customerData,
            staff: staffData,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.login = login;
// Google OAuth Login
const googleLogin = async (req, res) => {
    try {
        const { email, name, googleId, avatar } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Google account email is required.' });
            return;
        }
        let user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            user = await User_js_1.User.create({
                name: name || email.split('@')[0],
                email: email.toLowerCase(),
                googleId: googleId || `goog_${Date.now()}`,
                avatar: avatar || '',
                role: 'customer',
                isEmailVerified: true,
            });
            const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
            await Customer_js_1.Customer.create({
                user: user._id,
                customerId,
                companyName: `${user.name}'s Organization`,
                currency: 'INR',
                referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            });
            await (0, emailService_js_1.sendWelcomeEmail)(user.email, user.name, user.role);
        }
        else {
            if (googleId && !user.googleId) {
                user.googleId = googleId;
            }
            if (avatar && !user.avatar) {
                user.avatar = avatar;
            }
            user.lastLogin = new Date();
            user.loginCount += 1;
            await user.save();
        }
        let customerData = null;
        if (user.role === 'customer') {
            customerData = await Customer_js_1.Customer.findOne({ user: user._id });
        }
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'GOOGLE_LOGIN_SUCCESS',
            entity: 'User',
            entityId: user._id.toString(),
            details: { role: user.role },
            req,
        });
        const token = generateToken(user._id.toString(), user.role);
        res.json({
            success: true,
            message: 'Google login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            customer: customerData,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.googleLogin = googleLogin;
// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Please provide your account email address.' });
            return;
        }
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Return success anyway to avoid user enumeration
            res.json({
                success: true,
                message: 'If an account with that email exists, password reset instructions have been sent.',
            });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
        await (0, emailService_js_1.sendPasswordResetEmail)(user.email, resetUrl);
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'PASSWORD_RESET_REQUESTED',
            entity: 'Security',
            details: { email: user.email },
            req,
        });
        res.json({
            success: true,
            message: 'Password reset instructions have been sent to your email address.',
            demoResetUrl: resetUrl, // Helpful for local sandbox/testing
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.forgotPassword = forgotPassword;
// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ success: false, message: 'Token and new password are required.' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
            return;
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_js_1.User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        }).select('+passwordResetToken +passwordResetExpires');
        if (!user) {
            res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
            return;
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'PASSWORD_RESET_SUCCESS',
            entity: 'Security',
            details: { email: user.email },
            req,
        });
        res.json({
            success: true,
            message: 'Your password has been successfully reset. You may now log in.',
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.resetPassword = resetPassword;
// Get current user profile
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        let customer = null;
        let staff = null;
        if (req.user.role === 'customer') {
            customer = await Customer_js_1.Customer.findOne({ user: req.user._id });
        }
        else if (req.user.role === 'staff') {
            staff = await Staff_js_1.Staff.findOne({ user: req.user._id });
        }
        res.json({
            success: true,
            user: req.user,
            customer,
            staff,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getMe = getMe;
// Super Admin Registers Staff Member
const registerStaff = async (req, res) => {
    try {
        const { name, email, password, department, designation, permissions } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            return;
        }
        const existingUser = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'User with this email already exists.' });
            return;
        }
        const user = await User_js_1.User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: 'staff',
        });
        const employeeId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
        const staff = await Staff_js_1.Staff.create({
            user: user._id,
            employeeId,
            department: department || 'Billing',
            designation: designation || 'Billing Operations Analyst',
            permissions: permissions || ['read:customers', 'manage:invoices', 'read:payments', 'read:subscriptions'],
            createdBy: req.user?._id,
        });
        await (0, auditLogger_js_1.logAudit)({
            user: req.user,
            action: 'STAFF_MEMBER_CREATED',
            entity: 'User',
            entityId: user._id.toString(),
            details: { staffEmail: user.email, employeeId, department },
            req,
        });
        res.status(201).json({
            success: true,
            message: 'Staff member created successfully.',
            staff: {
                id: staff._id,
                employeeId: staff.employeeId,
                name: user.name,
                email: user.email,
                department: staff.department,
                designation: staff.designation,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.registerStaff = registerStaff;
// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { name, phoneNumber, avatar, companyName, taxId, billingAddress, currency } = req.body;
        const user = await User_js_1.User.findById(req.user?._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        if (name)
            user.name = name;
        if (phoneNumber !== undefined)
            user.phoneNumber = phoneNumber;
        if (avatar)
            user.avatar = avatar;
        await user.save();
        if (user.role === 'customer') {
            const customer = await Customer_js_1.Customer.findOne({ user: user._id });
            if (customer) {
                if (companyName)
                    customer.companyName = companyName;
                if (taxId !== undefined)
                    customer.taxId = taxId;
                if (billingAddress)
                    customer.billingAddress = { ...customer.billingAddress, ...billingAddress };
                if (currency)
                    customer.currency = currency;
                await customer.save();
            }
        }
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'PROFILE_UPDATED',
            entity: 'User',
            entityId: user._id.toString(),
            req,
        });
        res.json({
            success: true,
            message: 'Profile updated successfully.',
            user,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateProfile = updateProfile;
// Upload or Update Profile Photo (Cloudinary + Preset URL + Data URL)
const uploadAvatar = async (req, res) => {
    try {
        const { image, avatarUrl } = req.body;
        const user = await User_js_1.User.findById(req.user?._id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        let finalAvatarUrl = avatarUrl;
        if (image) {
            try {
                if (typeof image === 'string' && image.startsWith('data:image')) {
                    const result = await cloudinary_1.v2.uploader.upload(image, {
                        folder: 'subflow_avatars',
                        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
                    });
                    finalAvatarUrl = result.secure_url;
                }
                else {
                    finalAvatarUrl = image;
                }
            }
            catch (cloudErr) {
                console.warn('Cloudinary upload warning, saving direct image URL/base64:', cloudErr.message);
                finalAvatarUrl = image;
            }
        }
        if (!finalAvatarUrl) {
            res.status(400).json({ success: false, message: 'No photo image provided.' });
            return;
        }
        user.avatar = finalAvatarUrl;
        await user.save();
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'AVATAR_UPDATED',
            entity: 'User',
            entityId: user._id.toString(),
            details: { avatarUrl: finalAvatarUrl },
            req,
        });
        res.json({
            success: true,
            message: 'Profile photo updated successfully!',
            avatar: finalAvatarUrl,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                status: user.status,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.uploadAvatar = uploadAvatar;
// Change User Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Current password and new password are required.' });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
            return;
        }
        const user = await User_js_1.User.findById(req.user?._id).select('+password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Current password is incorrect.' });
            return;
        }
        user.password = newPassword;
        await user.save();
        await (0, auditLogger_js_1.logAudit)({
            user,
            action: 'PASSWORD_CHANGED',
            entity: 'User',
            entityId: user._id.toString(),
            req,
        });
        res.json({
            success: true,
            message: 'Your password has been changed successfully.',
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.changePassword = changePassword;
