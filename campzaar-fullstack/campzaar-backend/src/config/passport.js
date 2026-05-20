const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', profile && profile.emails ? profile.emails.map(e=>e.value) : profile);
        const email = profile.emails[0].value;
        const avatar_url = profile.photos?.[0]?.value || "";

        // enforce allowed domain only if configured
        const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN; // e.g. chitkara.edu.in
        if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
          console.warn(`Google login rejected for ${email}; domain not allowed`);
          return done(null, false, { message: `Only ${allowedDomain} accounts allowed` });
        }

        // TODO: check DB (for now simple user)
        const user = {
          email,
          name: profile.displayName,
          avatar_url,
        };

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
