import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app)

//initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ same as frontend
    credentials: true                // ✅ match client
  }
});


//store online users
export const userSocketMap = {};

//socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ Correct disconnection handler
  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


app.use(express.json({limit:"4mb"}))
app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  credentials: true
}));
//Routes setup
app.use("/api/status",(req,res)=>res.send("Server is live"))
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter)


await connectDB();
const env = process.env.ENV || "development";
if (env === "production") {
  // ...
  const PORT = process.env.PORT || 5000;

  server.listen(PORT,()=>console.log("Server is running on PORT:"+PORT));
}


export default server;


