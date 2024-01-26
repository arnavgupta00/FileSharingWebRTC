"use client";
import "@/app/page.css";
import "@/app/callRoom/page.css";
import Navbar from "@/components/navbar/navbar";
import { useRef, useEffect, useState, useCallback } from "react";
import { socket, userAction } from "@/components/functions/function";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useDropzone } from "react-dropzone";

import {} from "lucide-react";

import {
  dataChannelExport,
  setDataChannelExport,
  // files,
  // setFiles,
  setRoomNoVar,
  setFormData,
  formData,
  roomNoVar,
  addClient,
  getClients,
  addPeerConnection,
  getPeerConnections,
  removePeerConnection,
} from "@/components/variableSet/variableSet";

const page = () => {
  const isMobileOrTablet = useMediaQuery("(max-width: 767px)");

  const clientStreamMap = new Map<string, MediaStream>();
  const [width, setWidth] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  const [messageList, setMessageList] = useState<any[]>([]);

  const [files, setFiles] = useState<File[]>([]);

  const [fileCompleted, setFileCompleted] = useState<boolean[]>([]);

  const [progress, setProgress] = useState<number>(0);

  const [speedTransferBPS, setSpeedTransferBPS] = useState<number>(0);

  const fileMap = new Map<File, any>();

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },

      { urls: "stun:global.stun.twilio.com:3478" },
    ],
  };
  var receivedBuffers: any[] = [];
  var fileSize = 0;
  var fileType: string = "";
  var fileName: string = "";
  var bytesReceived = 0;
  var startTime: any = 0,
    endTime: any;

  var totalTimeElapsed = 0; // MS

  const sendOffer = async (client: string) => {
    console.log("OFFER SENT TO", client);
    const pcStore: RTCPeerConnection = new RTCPeerConnection(configuration);

    var dataChannel = pcStore.createDataChannel("fileTransfer");
    dataChannel.bufferedAmountLowThreshold = 1024 * 1024; //1024 KB;
    offerEvenSetup(pcStore, client, dataChannel);
    eventlistenerSetup(pcStore, client);
    addPeerConnection(client, pcStore);

    const pcList = getPeerConnections();
    const pc = pcList[client];

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(
      JSON.stringify({
        type: "offer",
        offer: offer,
        target: client,
      })
    );

    addPeerConnection(client, pc);

    console.log(pc);
  };

  const handleNegotiationNeededOffer = async (client: string) => {
    const pcList = getPeerConnections();
    const pc = pcList[client];

    if (pc) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send(
        JSON.stringify({
          type: "offer",
          offer: offer,
          target: client,
          negotiation: true,
        })
      );

      console.log(`NEGOTIATION OFFER SENT TO ${client}`);
      addPeerConnection(client, pc);
    }
  };
  const handleNegotiationNeededAnswer = async (data: any) => {
    console.log(`NEGOTIATION OFFER BY ${data.senderID} RECIEVED`);
    const pcList = getPeerConnections();
    const pc = pcList[data.senderID];

    if (!pc) return; // Return

    const remoteDescription = data.payloadOffer
      ? new RTCSessionDescription(data.payloadOffer)
      : null;
    if (!remoteDescription) return; // Return

    await pc.setRemoteDescription(remoteDescription);
    const answer = await pc.createAnswer();

    await pc.setLocalDescription(answer);

    socket.send(
      JSON.stringify({
        type: "answer",
        answer: answer,
        target: data.senderID,
        negotiation: true,
      })
    );

    console.log(`ANSWER SENT TO ${data.senderID}`, answer);
    console.log("PEER CONNECTION NEGO", pc);
    addPeerConnection(data.senderID, pc);
  };

  const sendAnswer = async (data: any) => {
    const pcListINI = getPeerConnections();

    console.log(` OFFER BY ${data.senderID} RECIEVED`);

    const pcStore: RTCPeerConnection = new RTCPeerConnection(configuration);
    offerEvenSetup(pcStore, data.senderID, null);
    eventlistenerSetup(pcStore, data.senderID);

    addPeerConnection(data.senderID, pcStore);
    negotiationEventlistenerSetup(pcStore, data.senderID);
    const pcList = getPeerConnections();
    const pc = pcList[data.senderID];

    if (!pc) return; // Return

    const remoteDescription = data.payloadOffer
      ? new RTCSessionDescription(data.payloadOffer)
      : null;
    if (!remoteDescription) return; // Return

    await pc.setRemoteDescription(remoteDescription);
    const answer = await pc.createAnswer();

    await pc.setLocalDescription(answer);

    socket.send(
      JSON.stringify({
        type: "answer",
        answer: answer,
        target: data.senderID,
      })
    );

    console.log(`ANSWER SENT TO ${data.senderID}`, answer);

    console.log("PEER CONNECTION", pc);
    addPeerConnection(data.senderID, pc);

    socket.send(
      JSON.stringify({
        type: "clientList",

        target: "JAI SHRI RAM",
      })
    );

    //addTrackAddon(streamLocal);
  };

  const handleIceCandidate = (event: any, clientId: any) => {
    console.log("ICE CANDIDATE", event, clientId);
    const pcList = getPeerConnections();
    const pc = pcList[clientId];
    if (event.candidate && pc) {
      socket.send(
        JSON.stringify({
          type: "iceCandidate",
          candidate: event.candidate,
          target: clientId,
        })
      );

      console.log("ICE CANDIDATE DISPATCHED", {
        type: "iceCandidate",
        candidate: event.candidate,
        target: clientId,
      });
    }
  };

  const handleRecieveIceCandidate = async (data: any) => {
    const pcList = getPeerConnections();
    const pc = pcList[data.senderID];
    console.log("RECIEVED ICE CANDIDATE", data);
    if (pc) {
      try {
        const candidate = new RTCIceCandidate(data.candidate);
        await pc.addIceCandidate(candidate);
        console.log("ICE CANDIDATE RECIEVED AND ADDED", candidate);
      } catch (err) {
        console.log("error", err, data.senderID, pc);
      }
    }
  };

  const handleRecieveOffer = async (data: any) => {
    const pcList = getPeerConnections();
    const pc = pcList[data.senderID];
    console.log("NEEDED PC IF TRUE---------------2 TIMES RUN", pc);
    if (!pc) {
      await sendAnswer(data);
    }
  };

  const handleRecieveAnswer = async (data: any, client: string) => {
    if (data.answer) {
      const pcList = getPeerConnections();
      const pc = pcList[data.senderID];
      console.log(
        `PROCEEDED ANSWER FROM ${client} ${data.senderID}`,
        pcList[data.senderID]
      );

      if (pcList[data.senderID]) {
        console.log(`PROCEEDED FURTHER ANSWER FROM ${client} ${data.senderID}`);

        await pcList[data.senderID].setRemoteDescription(
          new RTCSessionDescription(data.answer)
        ); //data.answer is the answer recieved

        addPeerConnection(data.senderID, pcList[data.senderID]);

        console.log("remote description set", data.answer);
        console.log(
          "After setting remote description:",
          pcList[data.senderID].iceConnectionState,
          pcList[data.senderID].iceGatheringState
        );

        addPeerConnection(data.senderID, pcList[data.senderID]);
        console.log("pc", pcList[data.senderID]);
      }
    }
  };

  const handleChat = (data: any) => {
    console.log("CHAT RECIEVED", data);

    var messageComp: JSX.Element = (
      <div style={{ textAlign: "left", width: "100%" }}>
        <h3 style={{ margin: 0 }}>{data.message}</h3>
        <h5 style={{ margin: 0 }}>{data.senderID}</h5>
        <br />
      </div>
    );

    setMessageList((prevList) => [...prevList, messageComp]);
  };
  const handleSendChat = (message: string) => {
    if (message === "") return;
    socket.send(
      JSON.stringify({
        type: "chat",
        message: message,
        senderName: "Arnav",
      })
    );

    var messageComp: JSX.Element = (
      <div style={{ textAlign: "right", width: "100%" }}>
        <h3 style={{ margin: 0 }}>{message}</h3>
        <br />
      </div>
    );

    setMessageList((prevList) => [...prevList, messageComp]);
    setMessage("");
  };
  const handleStartVideoButton = () => {
    const pcList = getPeerConnections();
    const clientList = getClients();
    const clientListSet = new Set(clientList);
    const clientListArray = Array.from(clientListSet);
    clientListArray.forEach(async (client) => {
      if (!pcList[client]) {
        await sendOffer(client);
      }
    });
  };

  const connectionInitiator = async (list: string[]) => {
    const pcList = getPeerConnections();

    socket.onmessage = async (event) => {
      const data = await JSON.parse(event.data);

      if (data.type === "offer") {
        console.log(`RECIEVED OFFER FROM ${data.senderID}`);
        if (data.negotiation) {
          await handleNegotiationNeededAnswer(data);
        } else {
          await handleRecieveOffer(data);
        }
      } else if (data.type === "answer") {
        console.log(`RECIEVED ANSWER FROM ${data.senderID}`);

        await handleRecieveAnswer(data, data.senderID);
      } else if (data.type === "candidate") {
        await handleRecieveIceCandidate(data);
      } else if (data.type === "clientList") {
        var listClients = getClients();
        data.list.forEach((client: string) => {
          if (listClients.includes(client) === false) {
            addClient(client);
          }
        });
        console.log("CLIENT LIST RECIEVED", data);
      } else if (data.type === "initialClientList") {
        var listClients = getClients();
        data.list.forEach((client: string) => {
          if (listClients.includes(client) === false) {
            addClient(client);
          }
        });
        var clientList = getClients();
        const clientListSet = new Set(clientList);
        clientList = Array.from(clientListSet);
        clientList.forEach(async (client) => {
          if (!pcList[client]) {
            await sendOffer(client);
          }
        });
        console.log("INI CLIENT LIST RECIEVED", data);
      } else if (data.type === "chat") {
        handleChat(data);
      } else {
        console.log("RECIEVED SOMETHING ELSE", data);
      }
    };
  };

  const addTrackAddon = async (stream: MediaStream) => {
    var clientList = getClients();
    const clientListSet = new Set(clientList);
    clientList = Array.from(clientListSet);

    console.log("client list", clientList);

    clientList.forEach((client) => {
      const pcList = getPeerConnections();
      const pc = pcList[client];
      if (stream) {
        if (pc) {
          try {
            negotiationEventlistenerSetup(pc, client);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            console.log(
              `TRACK ADDED BY FUNCTION FOR ${client}`,
              stream.getTracks()
            );
          } catch (err) {
            console.log("error", err);
          }
        }
      }

      addPeerConnection(client, pc);
    });
  };

  const handleDataEvent = (event: any, clientID: string, dataChannel: any) => {
    console.log("DATA EVENT", event.channel);

    var mediaStream = clientStreamMap.get(clientID) || new MediaStream();

    clientStreamMap.set(clientID, mediaStream);
    if (event.channel) {
      const receiveChannel = event.channel;

      receiveChannel.onmessage = function (event: any) {
        processReceivedFile(event);
      };
      receiveChannel.onopen = function (event: any) {
        console.log("receiveChannel Data Channel is open");
      };

      receiveChannel.onclose = function () {
        console.log("receiveChannel Data Channel is closed");
      };
    }
  };

  const eventlistenerSetup = (pc: RTCPeerConnection, clientID: string) => {
    pc.onicecandidate = (event) => handleIceCandidate(event, clientID);

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected") {
      }
    };
  };

  const negotiationEventlistenerSetup = (
    pc: RTCPeerConnection,
    clientID: string
  ) => {
    pc.onnegotiationneeded = async () => {
      console.log("NEGOTIATION NEEDED");
      await handleNegotiationNeededOffer(clientID);
    };
  };
  const offerEvenSetup = (
    pc: RTCPeerConnection,
    clientID: string,
    dataChannel: any
  ) => {
    try {
      if (dataChannel) {
        dataChannel.onopen = function (event: any) {
          setDataChannelExport(dataChannel);
          console.log("Data Channel is open");
        };

        dataChannel.onclose = function () {
          console.log("Data Channel is closed");
        };

        console.log(`DATA CHANNEL ADDED FOR ${clientID}`, pc);
      }
    } catch (err) {
      console.log("error", err);
    }

    pc.ondatachannel = (event) => {
      handleDataEvent(event, clientID, dataChannel);
    };
  };
  const onDrop = useCallback((acceptedFiles: any) => {
    setFiles(acceptedFiles);
    console.log("acceptedFiles", acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const sendFile = async (dataChannel: any, file: File) => {
    return new Promise((resolve, reject) => {
      const chunkSize = 262144; // 256 KB
      const fileReader = new FileReader();
      let offset = 0;

      console.log("FILE SEND SUCCESSFUL");
      const readSlice = (o: number) => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
      };
      fileReader.onload = (e: any) => {
        if (offset < file.size) {
          if (
            dataChannel.bufferedAmount < dataChannel.bufferedAmountLowThreshold
          ) {
            dataChannel.send(e.target.result);
            offset += e.target.result.byteLength;
            setProgress((offset / file.size) * 100);

            endTime = performance.now();

            const timeElapsed = endTime - startTime;
            totalTimeElapsed += timeElapsed;

            setSpeedTransferBPS(offset / (totalTimeElapsed / 1000));

            if (offset === file.size) {
              console.log("FILE SENT COMPLETE");
              setProgress(0);
              setSpeedTransferBPS(0);
              fileMap.set(file, true);
              resolve(void 0);
            }
            startTime = performance.now();
            readSlice(offset);
          } else {
            readSlice(offset);
          }
        }
        fileReader.onerror = (error) => {
          console.error("Error reading file", error);
          reject(error);
        };
      };
      startTime = performance.now();
      readSlice(0);
    });
  };
  const processReceivedFile = (event: any) => {
    console.log("FILE RECIEVED SUCCESSFUL");
    if (typeof event.data === "string") {
      console.log(`Received METADATA`);
      const metadata = JSON.parse(event.data);
      fileSize = metadata.fileSize;
      fileType = metadata.fileType;
      fileName = metadata.fileName;

      const fileObject = new File([], fileName, { type: fileType });

      setFiles((prev) => [...prev, fileObject]);
      return;
    }

    receivedBuffers.push(event.data);
    bytesReceived += event.data.byteLength;
    setProgress((bytesReceived / fileSize) * 100);
    // progress UI
    endTime = performance.now();

    const timeElapsed = endTime - startTime;
    totalTimeElapsed += timeElapsed;

    setSpeedTransferBPS(bytesReceived / (totalTimeElapsed / 1000));

    if (bytesReceived === fileSize) {
      console.log("File transfer complete");
      const received = new Blob(receivedBuffers, { type: fileType });
      receivedBuffers = [];
      bytesReceived = 0;
      setProgress(0);
      setSpeedTransferBPS(0);

      downloadReceivedFile(received);
      setFileCompleted((prev) => [...prev, true]);
    }
    startTime = performance.now();
  };
  const downloadReceivedFile = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName || "download"; // rename
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const handleFormSubmit = (event: any) => {
    event.preventDefault();
    handleSendChat(message);
  };

  const handleFileSend = async (
    file: File,
    dataChannel: RTCDataChannel,
    index: number
  ): Promise<void> => {
    fileMap.set(file, false);
    if (index !== 0) {
      await waitForFileCompletion(files[index - 1]);
    }
    console.log("FILE SENT---", file);
    setProgress(0);
    console.log(file);
    const metadata = JSON.stringify({
      type: "metadata",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    fileMap.set(file, "inProg");

    dataChannel.send(metadata);

    await sendFile(dataChannel, file);

    setFileCompleted((prev) => [...prev, true]);
  };

  const waitForFileCompletion = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (fileMap.get(file) === true) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };
  const startSharing = async (dataChannel: any) => {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      await handleFileSend(file, dataChannel, index);
    }
  };

  useEffect(() => {
    var clientList = getClients();
    const clientListSet = new Set(clientList);
    clientList = Array.from(clientListSet);

    console.log("LIST OF CLIENTS", clientList);

    const start = async () => {
      connectionInitiator(clientList);
    };
    start();

    return () => {
      var clientList = getClients();
      const clientListSet = new Set(clientList);
      clientList = Array.from(clientListSet);
      console.log("CLEANUP FIRED");
      clientList.forEach((client) => {
        const pcList = getPeerConnections();
        const pc = pcList[client];
        if (pc) {
          pc.close();
          console.log("CLEANUP FIRED", client);
          removePeerConnection(client);
        }
      });
    };
  }, []);

  return (
    <>
      <Navbar />
      <div id="mainLayoutDiv">
        <div id="mainLayoutDivSub1">
          {files.length > 0 ? (
            <div
              style={{
                paddingTop: "50px",
                scale: 0.9,
                overflowY: "scroll",
                display: "flex",
                width: "100%",
                height: "50vh",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {files.map((file, index) => {
                return (
                  <div
                    style={{
                      width: "90%",
                      height: "100px",
                      borderRadius: "15px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      backgroundColor: fileCompleted[index]
                        ? "rgb(38, 106, 38)"
                        : "black",
                      color: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    <h3>{file.name.slice(0, 10)}</h3>
                  </div>
                );
              })}
            </div>
          ) : null}

          {isMobileOrTablet ? (
            <div></div>
          ) : (
            <div className="chatSystem">
              <div className="chatDisplayBox">
                <div className="chatMessages">
                  {messageList.map((message) => message)}
                </div>
              </div>
              <form
                className="chatSubmitBoxForm"
                onSubmit={(event) => handleFormSubmit(event)}
              >
                <input
                  type="text"
                  onChange={(event) => {
                    setMessage(event.target.value);
                  }}
                  value={message}
                />
                <button onClick={() => handleSendChat(message)}>Send</button>
              </form>
            </div>
          )}
        </div>
        <div
          id="mainLayoutDivSub2"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          {userAction == "joinRoom" && (
            <>
              <button
                className="mainLayoutDivSub2JoinBtn"
                onClick={() => startSharing(dataChannelExport)}
                style={{marginBottom: "30px"}}
              >
                Click To Share
              </button>

              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive ? (
                  <div
                    className="dragNdrop"
                    style={{
                      border: "5px solid rgba(255, 255, 255, 0.5)",
                      borderRadius: "10px",
                      color: "rgba(255, 255, 255, 0.5)",
                      padding: "15px",
                    }}
                  >
                    Drop the files here ...
                  </div>
                ) : (
                  <div
                    className="dragNdrop"
                    style={{
                      border: "5px solid rgba(255, 255, 255, 0.5)",
                      borderRadius: "10px",
                      color: "rgba(255, 255, 255, 0.5)",
                      padding: "15px",
                    }}
                  >
                    Drag files here, or click{" "}
                  </div>
                )}
              </div>
            </>
          )}
          <div>
            <h1
              className="progressBar"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              Progress: {progress.toFixed(2)}
            </h1>
          </div>
          <div>
            <h1
              className="speedBar"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              Speed:{" "}
              {(Number(speedTransferBPS.toFixed(2)) / 1000_000).toFixed(2)} MB/S
            </h1>
          </div>
        </div>
      </div>
    </>
  );
};
export default page;
