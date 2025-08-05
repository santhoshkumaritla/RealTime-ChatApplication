
import cloudinary from "../lib/cloudinary";
import message from "../models/message";
import User from "../models/user";
import {io,user, userSocketMap} from "../server.js";

//get all user except the logged in user
export const getUsersForSidebar = async(req,res)=>{
  try{
    const userId  = req.user._id;

    const filterUsers = await User.find({_id:{$ne:userId}}).select("-password");

    const unseenMessages = {}
    const promises = filterUsers.map(async (user)=>{
      const messages = await message.find({senderId:user._id,receiverId:userId,seen:false})
      if(message.length>0){
        unseenMessages[user._id] = message.length
      }
    })
    await Promise.all(promises);
    res.json({success:true,users:filterUsers,unseenMessages})
  }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}

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

export const sendMessage = async(req,res)=>{
  try{
    const {text,image} = req.body;
    const receiverId = req.params.id;
    const senderId = req.params._id;

    let imageUrl;

    if(image){
      uploadResponse = await cloudinary.uploader.upload(image)
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await message.create({
      senderId,
      receiverId,
      text,
      image:imageUrl
    })

    //emit to new message to the receivers socket
    const receiverSocketId  = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage",newMessage)
    }

    res.json({success:true,newMessage})

  }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}