"use client";
import "@/app/page.css"
import "@/app/[roomAction]/page.css"
import Navbar from "@/components/navbar/navbar";
import { useRef, useEffect, useState } from 'react';
import { socket, userAction } from "@/components/functions/function"
import ReactPlayer from 'react-player';

import { streamLocal, setStreamLocal, tempaa, setTempaa, setRoomNoVar, setFormData, formData, roomNoVar, addClient, getClients, addPeerConnection, getPeerConnections } from "@/components/variableSet/variableSet"

import { RemoteMedia } from "@/components/video/remoteMedia";


const page = () => {

    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [remoteVideoTracks, setRemoteVideoTracks] = useState<MediaStreamTrack[]>([]);
    const [remoteAudioTracks, setRemoteAudioTracks] = useState<MediaStreamTrack[]>([]);

    const [remoteStream, setRemoteStream] = useState<MediaStream[]>([]);

    const [videoPremission, setVideoPremission] = useState<boolean>(true);
    const [audioPremission, setAudioPremission] = useState<boolean>(true);


    const [isInitialized, setIsInitialized] = useState<boolean>();


    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },

            { urls: 'stun:global.stun.twilio.com:3478' },


        ],

    };


    const handleEntry = async (client: string) => {
        if (userAction === "joinRoom") {
            //send offer to everyone in the room
            await sendOffer(client);
        } else if (userAction === "createRoom") {
            //wait for offer


        }

    }
    const sendOffer = async (client: string) => {
        await startLocalStream();
        const pcList = getPeerConnections();
        const pc = pcList[client];

        try {
            if (streamLocal) {
                streamLocal.getTracks().forEach((track) => pc.addTrack(track, streamLocal));


                console.log(`TRACK ADDED FOR ${client}`, streamLocal.getTracks());
            }
        } catch (err) {
            console.log("error", err);
        }
        const id = Math.random().toString(36).substring(7);



        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({
            type: "offer",
            offer: offer,
            senderID: id

        }))


        addPeerConnection(client, pc);

        console.log(pc)
    }

    const sendAnswer = async (data: any) => {

        await startLocalStream();

        const pcStore: RTCPeerConnection = new RTCPeerConnection(configuration);
        addPeerConnection(data.senderID, pcStore);

        const pcList = getPeerConnections();
        const pc = pcList[data.senderID];

        try {
            if (streamLocal) {
                streamLocal.getTracks().forEach((track) => pc.addTrack(track, streamLocal));


                console.log(`TRACK ADDED FOR ${data.senderID}`, streamLocal.getTracks(), pc);
            }
        } catch (err) {
            console.log("error", err);
        }


        if (!pc) return; // Return 
        const remoteDescription = data.payloadOffer ? new RTCSessionDescription(data.payloadOffer) : null;
        if (!remoteDescription) return; // Return 

        await pc.setRemoteDescription(remoteDescription);;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);


        socket.send(JSON.stringify({
            type: "answer",
            answer: answer,
            target: data.senderID,

        }))


        console.log(`ANSWER SENT TO ${data.senderID}`, answer);


        pc.onicecandidate = (event) => pc.onicecandidate = (event) => handleIceCandidate(event, data.senderID);;

        pc.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', pc.iceConnectionState);
        };

        pc.ontrack = (event) => { handleTrackEvent(event) };

        console.log("PEER CONNECTION", pc)
        addPeerConnection(data.senderID, pc);


    }



    const handleIceCandidate = (event: any, clientId: any) => {
        const pcList = getPeerConnections();
        const pc = pcList[clientId];
        if (event.candidate && pc) {
            socket.send(JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
                target: clientId
            }))


            console.log("ICE CANDIDATE DISPATCHED", {
                type: "iceCandidate",
                candidate: event.candidate,
                target: clientId
            });
        }

    };

    const handleRecieveIceCandidate = async (data: any) => {
        const pcList = getPeerConnections();
        const pc = pcList[data.senderID];
        console.log("RECIEVED ICE CANDIDATE", data)
        if (pc) {

            try {
                const candidate = new RTCIceCandidate(data.candidate);
                await pc.addIceCandidate(candidate);
                console.log("ICE CANDIDATE RECIEVED AND ADDED", candidate);

            } catch (err) { console.log("error", err, data.senderID, pc) }

        }
    }

    const createPeerConnection = async (clientId: string) => {
        const pcList = getPeerConnections();
        const pc = pcList[clientId];
        if (tempaa === 0 && !pc) {
            const pc = new RTCPeerConnection(configuration);
            console.log("peer connection state", pc.signalingState);
            console.log("RAN ONCE ------------------------");



            pc.onicecandidate = (event) => handleIceCandidate(event, clientId);

            pc.oniceconnectionstatechange = () => {
                console.log('ICE Connection State:', pc.iceConnectionState);
            };

            pc.ontrack = (event) => { handleTrackEvent(event) };

            addPeerConnection(clientId, pc);

            await handleEntry(clientId);
            console.log("count");


            setTempaa(1);

            return pc;
        }


    };

    const handleRecieveOffer = async (data: any) => {
        const pcList = getPeerConnections();
        const pc = pcList[data.senderID];
        console.log("NEEDED PC IF TRUE---------------2 TIMES RUN", pc);
        if (!pc) {

            await sendAnswer(data);
        }
    }

    const handleRecieveAnswer = async (data: any, client: string) => {
        if (data.answer) {
            const pcList = getPeerConnections();
            const pc = pcList[data.senderID];
            console.log(`PROCEEDED ANSWER FROM ${client} ${data.senderID}`, pcList[data.senderID]);
            if (pcList[data.senderID]) {
                console.log(`PROCEEDED FURTHER ANSWER FROM ${client} ${data.senderID}`);

                await pcList[data.senderID].setRemoteDescription(new RTCSessionDescription(data.answer)); //data.answer is the answer recieved
                addPeerConnection(data.senderID, pcList[data.senderID]);

                console.log("remote description set", data.answer);
                console.log('After setting remote description:', pcList[data.senderID].iceConnectionState, pcList[data.senderID].iceGatheringState);

                pcList[data.senderID].onicecandidate = (event) => pcList[data.senderID].onicecandidate = (event) => handleIceCandidate(event, data.senderID);;

                pcList[data.senderID].oniceconnectionstatechange = () => {
                    console.log('ICE Connection State:', pcList[data.senderID].iceConnectionState);
                };

                pcList[data.senderID].ontrack = (event) => { handleTrackEvent(event) };

                addPeerConnection(data.senderID, pcList[data.senderID]);
                console.log("pc", pcList[data.senderID])
            }

        }
    }

    const connectionInitiator = async (list: string[]) => {
        const pcList = getPeerConnections();
        socket.onmessage = async (event) => {

            const data = await JSON.parse(event.data);
            if (data.type === "offer") {
                await handleRecieveOffer(data);

            } else if (data.type === "candidate") {
                console.log("recieved ice candidate", data);
                await handleRecieveIceCandidate(data);

            } else {
                console.log("recieved something else", data);
            }


        }
        if (list.length === 0 || list === null) {
            socket.onmessage = async (event) => {

                const data = await JSON.parse(event.data);
                if (data.type === "offer") {
                    await handleRecieveOffer(data);

                } else if (data.type === "candidate") {
                    console.log("recieved ice candidate", data);
                    await handleRecieveIceCandidate(data);

                } else {
                    console.log("recieved something else", data);
                }


            }
        } else if (list.length > 0) {
            list.forEach(async (client) => {
                if (!pcList[client]) {
                    setTimeout(async () => {
                        await createPeerConnection(client);
                    }, 2000);
                    console.log("INCOMING LIST")

                    socket.onmessage = async (event) => {

                        const data = await JSON.parse(event.data);

                        if (data.type === "offer") {

                            await handleRecieveOffer(data);

                        } else if (data.type === "answer") {
                            console.log(`RECIEVED ANSWER FROM ${client} ${data.senderID}`)
                            await handleRecieveAnswer(data, data.senderID);

                        } else if (data.type === "candidate") {

                            await handleRecieveIceCandidate(data);

                        } else {
                            console.log("recieved something else", data);
                        }


                    }
                    return () => {


                    }
                }
            });
        }
    }

    const addTrackAddon = async (stream: MediaStream) => {

        var clientList = getClients();
        const clientListSet = new Set(clientList);
        clientList = Array.from(clientListSet);

        console.log("client list", clientList)

        clientList.forEach((client) => {
            const pcList = getPeerConnections();
            const pc = pcList[client];
            if (stream) {
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));


                console.log(`TRACK ADDED FOR ${client}`, stream.getTracks());
            }

            addPeerConnection(client, pc);
        });

    }

    const handleTrackEvent = (event: any) => {
        console.log("track event", event.track);
        const track = event.track;

        const mediaStream = new MediaStream();

        if (track.kind === 'video') {
            mediaStream.addTrack(track);

            setRemoteVideoTracks((prevTracks) => [...prevTracks, track]);
        }
        if (track.kind === 'audio') {
            mediaStream.addTrack(track);

            setRemoteAudioTracks((prevTracks) => [...prevTracks, track]);
        }

        setRemoteStream((prevStreams) => [...prevStreams, mediaStream]);

    }

    const startLocalStream = async () => {
        try {
            const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: videoPremission, audio: audioPremission });
            setStreamLocal(stream);

            //await addTrackAddon(streamLocal);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = streamLocal;

            }
        } catch (error) {
            console.error('Error accessing local media:', error);
        }
    };
    useEffect(() => {

        var clientList = getClients();
        const clientListSet = new Set(clientList);
        clientList = Array.from(clientListSet);


        startLocalStream();
        connectionInitiator(clientList);




        { console.log("remote video tracks", remoteStream) }

        return () => {
            const tracks = (localVideoRef.current?.srcObject as MediaStream)?.getTracks();
            tracks && tracks.forEach((track: MediaStreamTrack) => track.stop());
        }

    }, [remoteStream]);
    /* <h1>Remote Video Streams</h1>
                        {remoteVideoTracks.map((videoTrack, index) => (
                            <RemoteMedia key={index} track={videoTrack} isVideo />
                        ))}

                        <h1>Remote Audio Streams</h1>
                        {remoteAudioTracks.map((audioTrack, index) => (
                            <RemoteMedia key={index} track={audioTrack} isVideo={false} />
                        ))} */

    return (


        <>
            <Navbar />
            <div id='mainLayoutDiv' style={{ display: 'flex', flexDirection: 'row', justifyContent: "center", alignItems: "center" }}>
                <div id='mainLayoutDivSub1' style={{ width: '20%', margin: "1%", marginLeft: ".5%", height: "85vh", marginTop: "3.5%", backgroundColor: "black", opacity: 0.3 }}>

                    <div style={{ opacity: 1, width: "100%", height: "40%" }}>
                        {(videoPremission) ? (<video ref={localVideoRef} autoPlay playsInline muted style={{ width: '95%', height: "90%", margin: "2.5%", opacity: 1 }}></video>) : (<div style={{ width: '95%', margin: "2.5%", height: "90%", backgroundColor: "white" }}></div>)}
                        <button onClick={() => setVideoPremission(!videoPremission)}>Video</button>
                        <button onClick={() => setAudioPremission(!audioPremission)}>Audio</button>
                        <button onClick={() => addTrackAddon(streamLocal)}>Send Video</button>
                    </div>

                </div>
                <div id='mainLayoutDivSub2' style={{ textDecoration: "none", width: '77%', margin: "1%", marginRight: ".5%", height: "85vh", marginTop: "3.5%", backgroundColor: "black", opacity: 0.3 }}>

                    <div>

                        {remoteStream.map((stream) => (

                            <>
                                <h1>Remote Stream</h1>
                                <ReactPlayer
                                    key={stream.id}
                                    playing
                                    
                                    height="100px"
                                    width="200px"
                                    url={stream}
                                />
                            </>

                        ))}
                    </div>
                </div>
            </div>

        </>
    )

}
export default page;