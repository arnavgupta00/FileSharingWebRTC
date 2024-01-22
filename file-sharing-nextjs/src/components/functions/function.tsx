"use client";


import { use } from "react";
import {
  setRoomNoVar,
  setFormData,
  formData,
  roomNoVar,
  addClient,
  getClients,
} from "../variableSet/variableSet";
import "dotenv/config";

export var socket: WebSocket;

export var socketReadyState: boolean = false;
export const removeSocket = () => {
  socket?.close();
}
export const setSocket = () => {
  
  socket = new WebSocket("wss://videochatsignallingserverrender.onrender.com/");
  socket.onopen = () => {
    console.log("WebSocket connection established.");
    socketReadyState = true;
  
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
  return socket;
};

export var userAction = "";

export const handleOnJoin = (socket: WebSocket) => {
  console.log(formData);
  console.log(roomNoVar);
  startingStep("joinRoom", socket);
  userAction = "joinRoom";
};

export const handleOnCreate = (socket: WebSocket) => {
  console.log(formData);
  console.log(roomNoVar);
  startingStep("createRoom", socket);
  userAction = "createRoom";
};

const startingStep = async (type: string, socket: WebSocket) => {
  const sendString = JSON.stringify({
    type: type,
    roomId: "room" + roomNoVar,
    userId: formData.userName + "_" + formData.userEmail,
  });
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(sendString);
  } else {
    if(type === "createRoom"){
      window.location.replace('/roomCreate');
    }else if(type === "joinRoom"){
      window.location.replace('/roomJoin');
    }  
    
  }
  
};
