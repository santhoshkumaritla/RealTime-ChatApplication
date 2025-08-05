import express from "express"
import { protectRoute } from "../middlewares/auth";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controller/messageController";


const messageRouter = express.Router();

messageRoute.get("/users",protectRoute,getUsersForSidebar);
messageRoute.get("/:id",protectRoute,getMessages)
messageRoute.get("mark/:id",protectRoute,markMessageAsSeen)
messageRouter.post("/send/:id",protectRoute,sendMessage)

export default messageRouter;