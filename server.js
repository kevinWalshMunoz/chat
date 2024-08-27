const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit(
      "message",
      formatMessage("ChatCord bot", "Welcome to ChatCord")
    );

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("ChatCord bot", `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("ChatCord bot", `${user.username} has left the chat`)
      );
    }

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
