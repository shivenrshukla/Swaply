// routes/video.js
const express = require("express");
const router = express.Router();
const { HMS_TEMPLATE_ID } = require("../config/vc");
const { createRoom, generateToken } = require("../utils/vc");
const auth = require("../middleware/auth");
router.post("/start-call",auth, async (req, res) => {
  const { callerName, calleeName } = req.body;

  if (!callerName || !calleeName) {
    return res.status(400).json({ error: "callerName and calleeName are required" });
  }

  try {
    const roomName = `call-${callerName}-${calleeName}-${Date.now()}`;
    const room = await createRoom(roomName, HMS_TEMPLATE_ID, `Call between ${callerName} and ${calleeName}`);

    const callerToken = await generateToken(room.id, callerName, "host");
    const calleeToken = await generateToken(room.id, calleeName, "host");

    res.json({
      roomId: room.id,
      roomName: room.name,
      tokens: {
        [callerName]: callerToken,
        [calleeName]: calleeToken,
      },
    });
  } catch (err) {
    console.error("Error starting call:", err?.response?.data || err.message);
    res.status(500).json({ error: "Could not start call" });
  }
});

module.exports = router;
