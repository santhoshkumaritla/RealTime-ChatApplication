import cloudinary from "../lib/cloudinary.js";
import message from "../models/message.js";
import User from "../models/user.js";
import {io,userSocketMap} from "../server.js";

//get all user except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const filterUsers = await User.find({ _id: { $ne: userId } }).select("-password");

    const unseenMessages = {};
    const promises = filterUsers.map(async (user) => {
      const messages = await message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
  unseenMessages[user._id] = messages.length;
}

    });

    await Promise.all(promises);

    // Add isOnline field to each user
    const usersWithOnlineStatus = filterUsers.map((user) => ({
      ...user._doc,
      isOnline: !!userSocketMap[user._id],
    }));

    res.json({
      success: true,
      users: usersWithOnlineStatus,
      unseenMessages,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


//get all message for selected user

export const getMessages = async(req,res)=>{
  try{
    const {id:selectedUserId} = req.params;
    const myId = req.user._id;

    const messages = await message.find({
      $or:[
        {senderId:myId,receiverId:selectedUserId},
        {senderId:selectedUserId,receiverId:myId},
      ]
    })
    await message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

    res.json({succes:true,messages})
  }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async(req,res)=>{
  try{
    const {id} = req.params;
    await message.findByIdAndUpdate(id,{seen:true})
    res.json({succes:true})
  }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}


//send message to selected user

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
  const uploadResponse = await cloudinary.uploader.upload(image);
  imageUrl = uploadResponse.secure_url;
}


    const newMessage = await message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Emit new message to the receiver's socket
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
