import express from "express"
import { protectRoute } from "../middlewares/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controller/messageController.js";


const messageRouter = express.Router();

messageRouter.get("/users",protectRoute,getUsersForSidebar);
messageRouter.get("/:id",protectRoute,getMessages)
messageRouter.get("/mark/:id",protectRoute,markMessageAsSeen)
messageRouter.post("/send/:id",protectRoute,sendMessage)

export default messageRouter;