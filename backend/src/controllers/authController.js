const { User, ActivityLog } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generateUserId = require('../utils/generateUserId');

const generateToken = (id, role, status) => {
    return jwt.sign({ id, role, status }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters and contain uppercase, lowercase, numbers, and a special character.' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // If they exist but aren't verified, let's update their info and resend the code
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`🔑 Resending verification code ${verificationCode} for ${email}`);

            userExists.name = name;
            userExists.password = hashedPassword;
            userExists.role = role || 'STUDENT';
            userExists.verificationCode = verificationCode;
            await userExists.save();

            const emailService = require('../services/emailService');
            try {
                await emailService.sendVerificationEmail(userExists.email, userExists.name, verificationCode);
            } catch (err) {
                console.error('Failed to send verification email:', err);
            }

            return res.status(200).json({
                success: true,
                message: "Verification code sent to email.",
                email: userExists.email
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await generateUserId(role || 'STUDENT');
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔑 Generated verification code ${verificationCode} for ${email}`);

        const user = await User.create({
            userId,
            name,
            email,
            password: hashedPassword,
            role: role || 'STUDENT',
            verificationCode,
            isVerified: false
        });

        if (user) {
            // 🎉 Send Verification Email
            const emailService = require('../services/emailService');
            try {
                await emailService.sendVerificationEmail(user.email, user.name, verificationCode);
            } catch (err) {
                console.error('Failed to send verification email:', err);
                // We still respond with 201 because the user was created
            }

            // Respond with success but NO TOKEN YET
            res.status(201).json({
                success: true,
                message: "Verification code sent to email.",
                email: user.email
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified.' });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        // 🚀 Mark as verified
        user.isVerified = true;
        user.verificationCode = null;
        await user.save();

        // 🎉 Send Welcome Email
        const emailService = require('../services/emailService');
        try {
            await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }

        res.json({
            _id: String(user.id),
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            token: generateToken(user.id, user.role, user.status),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.status === 'INACTIVE') {
                return res.status(403).json({ message: 'Account is inactive. Contact admin.' });
            }

            if (!user.isVerified) {
                return res.status(403).json({ message: 'Please verify your email address to log in.', unverified: true });
            }

            // Create a new Session Log
            const session = await ActivityLog.create({
                userId: user.id,
                loginTime: new Date()
            });

            res.json({
                _id: String(user.id),
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user.id, user.role, user.status),
                sessionId: session.id
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (sessionId) {
            const session = await ActivityLog.findByPk(sessionId);
            if (session && String(session.userId) === String(req.user.id)) {
                session.logoutTime = new Date();
                const durationMs = session.logoutTime.getTime() - new Date(session.loginTime).getTime();
                session.durationSeconds = Math.round(durationMs / 1000);
                await session.save();
            }
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe, logoutUser, verifyEmail };
