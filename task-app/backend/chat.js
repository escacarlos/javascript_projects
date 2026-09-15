import { User } from "./repositories/User.js";

export async function initChat(socket) {
  const user = await User.findById(socket.data.userId);
  if (!user) {
    socket.disconnect(true);
    return;
  }

  const username = user.username;

  socket.on("chat:message", (payload) => {
    const text = payload?.text;
    if (typeof text !== "string") return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const message = {
      username,
      text: trimmed,
      ts: Date.now(),
    };

    socket.broadcast.emit("chat:message", message);
  });
}
