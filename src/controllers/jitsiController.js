import jwt from "jsonwebtoken";

const JITSI_APP_ID = process.env.JITSI_APP_ID;
const JITSI_SECRET = process.env.JITSI_SECRET;
const JITSI_DOMAIN = "meet.jitsi"; // or your custom domain

export const getJitsiToken = (req, res) => {
  const user = req.user; // you already get this from Google auth middleware

  if (!user || !user.email.endsWith("@college.edu")) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const payload = {
    aud: "jitsi",
    iss: JITSI_APP_ID,
    sub: JITSI_DOMAIN,
    room: "*",
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    context: {
      user: {
        name: user.name,
        email: user.email,
        moderator: true
      }
    }
  };

  const token = jwt.sign(payload, JITSI_SECRET);
  res.json({ token });
};
