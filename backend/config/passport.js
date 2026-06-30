const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const bcrypt = require('bcryptjs')
const User = require('../models/User')

// Only registered when Google OAuth credentials are present in .env.
// Until then /api/auth/google returns a friendly "not configured" message
// instead of crashing the server (see routes/Auth.js).
exports.isGoogleAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

if (exports.isGoogleAuthConfigured) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value
            let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] })

            if (!user) {
                const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10)
                user = new User({
                    name: profile.displayName,
                    email,
                    password: randomPassword,
                    isVerified: true,
                    authProvider: 'google',
                    googleId: profile.id
                })
                await user.save()
            } else if (!user.googleId) {
                user.googleId = profile.id
                user.authProvider = 'google'
                await user.save()
            }

            return done(null, user)
        } catch (error) {
            return done(error, null)
        }
    }))
}

module.exports.passport = passport
