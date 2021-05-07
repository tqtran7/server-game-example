
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

module.exports = function(store) {
  return (socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
      const session = store.findSession(sessionID);
      if (session) {
        socket.sessionID = sessionID;
        socket.userID = session.userID;
        socket.username = session.username;
        return next();
      }
    }
    const username = socket.handshake.auth.username;
    if (!username) { return next(new Error("invalid username")); }
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.username = username;
    next();
  };
};
