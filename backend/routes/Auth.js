const express = require("express");
const router = express.Router();
const authController = require("../controllers/Auth");
const { verifyToken } = require("../middleware/VerifyToken");
const { passport, isGoogleAuthConfigured } = require("../config/passport");

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "neeraj@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass@123"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/signup", authController.signup)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "neeraj@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass@123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", authController.login)

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: "neeraj@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid OTP
 */
router.post("/verify-otp", authController.verifyOtp)

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "neeraj@example.com"
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.post("/resend-otp", authController.resendOtp)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "neeraj@example.com"
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post("/forgot-password", authController.forgotPassword)

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - passwordResetToken
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc1234"
 *               passwordResetToken:
 *                 type: string
 *                 example: "token123"
 *               newPassword:
 *                 type: string
 *                 example: "NewPass@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token
 */
router.post("/reset-password", authController.resetPassword)

/**
 * @swagger
 * /auth/check-auth:
 *   get:
 *     summary: Check if user is authenticated
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User is authenticated
 *       401:
 *         description: Not authenticated
 */
router.get("/check-auth", verifyToken, authController.checkAuth)

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get("/logout", authController.logout)

/**
 * @swagger
 * /auth/guest-checkout:
 *   post:
 *     summary: Start checkout without a full account (creates a lightweight guest user)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Guest session started
 */
router.post("/guest-checkout", authController.guestCheckout)

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth sign-in
 *     tags: [Auth]
 */
router.get("/google", (req, res, next) => {
    if (!isGoogleAuthConfigured) {
        return res.status(503).json({ message: "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend .env file." })
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next)
})

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 */
router.get("/google/callback", (req, res, next) => {
    if (!isGoogleAuthConfigured) {
        return res.redirect(`${process.env.ORIGIN || 'http://localhost:3000'}/login`)
    }
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.ORIGIN || 'http://localhost:3000'}/login` })(req, res, next)
}, authController.googleCallback)

module.exports = router