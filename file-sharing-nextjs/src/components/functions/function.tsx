"use client"

import { setRoomNoVar, setFormData, formData, roomNoVar, addClient, getClients } from "../variableSet/variableSet"
import "dotenv/config";


export const socket = new WebSocket("wss://videochatsignallingserverrender.onrender.com/");

export var userAction = "";

socket.onopen = () => {
    console.log("WebSocket connection established.");
    socket.send("Hello from client!");
};



socket.onopen = () => {
    console.log("WebSocket connection established.");
};

socket.onmessage = (event) => {
    console.log("Received message:", event.data);


    const data = JSON.parse(event.data);
    if (data.type === "clientList") {
        var listClients = getClients();
        data.list.forEach((client: string) => {
            if (listClients.includes(client) === false) {
                addClient(client);
            }
        });
    }
};

export const handleOnJoin = () => {
    console.log(formData);
    console.log(roomNoVar);
    startingStep("joinRoom");
    userAction = "joinRoom";
}

export const handleOnCreate = () => {
    console.log(formData);
    console.log(roomNoVar);
    startingStep("createRoom");
    userAction = "createRoom";
}

const startingStep = async (type: string) => {

    const sendString = JSON.stringify({
        type: type,
        roomId: "room" + roomNoVar,
        userId: formData.userName + "_" + formData.userEmail,
    })
    socket.send(sendString);

}


