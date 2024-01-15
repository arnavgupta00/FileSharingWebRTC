import { useRef, useEffect, useState } from 'react';

export const RemoteMedia = ({ track, isVideo }) => {
  const mediaRef = useRef();

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.srcObject = new MediaStream([track]);
    }
  }, [track]);

  return isVideo ? (
    <video ref={mediaRef} autoPlay playsInline />
  ) : (
    <audio ref={mediaRef} autoPlay playsInline />
  );
};
