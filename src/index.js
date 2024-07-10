const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const {generateMessage, generateLocation} = require("./utils/messages");
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDir = path.join(__dirname,"../public");
const port = process.env.PORT || 3000;
app.use(express.static(publicDir));

io.on("connection",(socket)=>{
    console.log("New connection");

    socket.on("sendLocation",({latitude,longitude}, callback)=>{
        const user = getUser(socket.id);
        if(user){
            io.to(user.room).emit("locationMessage",generateLocation(`https://google.com/maps?q=${latitude},${longitude}`, user.username));            
        }
        callback();
    })

    socket.on("join",({username, room}, callback)=>{
        const {error, user} = addUser({
            id:socket.id,
            username,
            room
        })

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit("message", generateMessage("Welcome!", "Admin"));
        socket.broadcast.to(user.room).emit("message",generateMessage(`${user.username} has joined!`, "Admin"));
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        
        callback();
    })

    socket.on("sendMessage",(message, callback)=>{
        const user = getUser(socket.id);
        if(user){
            io.to(user.room).emit("message",generateMessage(message, user.username));
        }
        callback();
        
    })
    socket.on("disconnect",()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit("message",generateMessage(`${user.username} was disconnected`,user.username));
            io.to(user.room).emit("roomData",{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }        
    })
})

server.listen(port,()=>{
    console.log("Server is running on port "+ port);
});