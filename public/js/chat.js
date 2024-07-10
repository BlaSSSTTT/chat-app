const socket = io();

const $messageForm = document.getElementById("messageForm");
const $sendLocationButton = document.getElementById("send-location");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.getElementById("messages");

const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix:true})


$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault();


    $messageFormButton.setAttribute("disabled", "disabled");
    const message = e.target.elements.message.value;

    socket.emit("sendMessage",message,()=>{
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        console.log("The message was delivered")
    });
})

$sendLocationButton.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser");
    }
    $sendLocationButton.setAttribute("disabled","disabled")
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit("sendLocation",{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute("disabled");
            console.log("Location was shared!");
        })
    })
})

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;

    const contentHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(contentHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }


    console.log()
}


socket.on("message",(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        message:message.text,
        createdAt:moment(message.createdAt).format("HH:mm"),
        username:message.username
    });
    $messages.insertAdjacentHTML("beforeend",html);
    autoscroll();
})
socket.on("locationMessage",(location)=>{
    console.log(location);
    const html = Mustache.render(locationTemplate,{
        location:location.url,
        createdAt: moment(location.createdAt).format("HH:mm"),
        username:location.username
    });
    $messages.insertAdjacentHTML("beforeend",html);
    autoscroll();
})
socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href ="/";
    }
});
socket.on("roomData",({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        users,
        room
    })
    document.getElementById("sidebar").innerHTML = html;
})