import jwt from "jsonwebtoken";
const { decode, verify } = jwt;

import User from "../models/user.js";

export const protectRoute = async (req,res,next)=>{
  try{
    const token = req.headers.token;

    const decoded = verify(token,process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if(!user){
      return res.json({success:false,message:"User not found"})
    }

    req.user = user;
    next();
  }catch(error){
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}
