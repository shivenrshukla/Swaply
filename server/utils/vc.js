// utils/100ms.js
const axios = require("axios");
const { HMS_BASE_URL, HMS_MANAGEMENT_TOKEN } = require("../config/vc");

const axios100ms = axios.create({
  baseURL: HMS_BASE_URL,
  headers: {
    Authorization: `Bearer ${HMS_MANAGEMENT_TOKEN}`,
  },
});

async function createRoom(name, templateId, description = "") {
  const res = await axios100ms.post("/rooms", {
    name,
    template_id: templateId,
    description,
  });
  return res.data;
}

async function generateToken(roomId, userId, role) {
  const res = await axios100ms.post("/room-tokens", {
    room_id: roomId,
    user_id: userId,
    role,
  });
  return res.data.token;
}

module.exports = {
  createRoom,
  generateToken,
};
