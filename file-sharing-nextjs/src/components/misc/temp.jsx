import React, { useState, useEffect, useRef } from 'react';
import { Button, FlatList, View } from 'react-native';
import io from 'socket.io-client';

const socket = io('http://your-signaling-server-ip:3001'); // Replace with your signaling server IP

const App = () => {
  const [localStream, setLocalStream] = useState(null);
  const [peerConnections, setPeerConnections] = useState({});
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [callActive, setCallActive] = useState(false);
  const localStreamRef = useRef();

  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = new RTCPeerConnection(configuration);
    addPeerConnection(pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        // Send ICE candidate to the other peer
        socket.emit('iceCandidate', { target: '', candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStreams((prevStreams) => [...prevStreams, e.streams[0]]);
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer to the other peer
    socket.emit('offer', { target: '', offer });

    setCallActive(true);
  };

  const addPeerConnection = (pc) => {
    const id = Math.random().toString(36).substring(7);
    pc.id = id;
    setPeerConnections((prevConnections) => ({
      ...prevConnections,
      [id]: pc,
    }));
  };

  useEffect(() => {
    socket.on('userJoined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);

    return () => {
      socket.off('userJoined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('iceCandidate', handleIceCandidate);
    };
  }, []);

  const handleUserJoined = (data) => {
    const { userId, socketId, allUsers } = data;
    const pc = new RTCPeerConnection(configuration);
    addPeerConnection(pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        // Send ICE candidate to the other peer
        socket.emit('iceCandidate', { target: socketId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStreams((prevStreams) => [...prevStreams, e.streams[0]]);
    };

    localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

    const offer = pc.createOffer();
    pc.setLocalDescription(offer);

    // Send offer to the other peer
    socket.emit('offer', { target: socketId, offer });
  };

  const handleOffer = async (data) => {
    const pc = peerConnections[data.id];
    const remoteDescription = new RTCSessionDescription(data.offer);
    await pc.setRemoteDescription(remoteDescription);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer to the other peer
    socket.emit('answer', { target: data.socketId, answer });
  };

  const handleAnswer = async (data) => {
    const pc = peerConnections[data.id];
    const remoteDescription = new RTCSessionDescription(data.answer);
    await pc.setRemoteDescription(remoteDescription);
  };

  const handleIceCandidate = (data) => {
    const pc = peerConnections[data.id];
    const candidate = new RTCIceCandidate(data.candidate);
    pc.addIceCandidate(candidate);
  };

  return (
    <View>
      <Button title="Start Call" onPress={startCall} />
      {localStream && <RTCView streamURL={localStream.toURL()} style={{ width: 100, height: 100 }} />}
      <FlatList
        data={remoteStreams}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <RTCView streamURL={item.toURL()} style={{ width: 100, height: 100 }} />
        )}
      />
    </View>
  );
};

export default App;
