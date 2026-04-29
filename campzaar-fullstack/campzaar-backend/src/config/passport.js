const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4001/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar_url = profile.photos?.[0]?.value || "";

        // 🔥 IMPORTANT FILTER (YOUR REQUIREMENT)
        if (!email.endsWith("@chitkara.edu.in")) {
          return done(null, false, { message: "Only Chitkara students allowed" });
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
