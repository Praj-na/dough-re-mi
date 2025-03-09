import React, { useEffect, useRef } from "react";

const AudioPlayer = ({ onTimeUpdate, isPlaying }) => {
    const audioRef = useRef(null);

    // useEffect(() => {
    //     const audio = audioRef.current;
    //     if (!audio) return;

    //     const handleTimeUpdate = () => {
    //         onTimeUpdate(audio.currentTime);
    //     };

    //     audio.addEventListener("timeupdate", handleTimeUpdate);
    //     return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    // }, [onTimeUpdate]);

    // return (
    //     <div>
    //         <audio ref={audioRef} src="/songs/espresso/clip-instrumental.mp3" />
    //         <button onClick={() => audioRef.current.play()}>Start Karaoke</button>
    //     </div>
    // );

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play();
        }
    }, [isPlaying]);

    return (
        <audio ref={audioRef} src="/songs/espresso/clip-instrumental.mp3" onTimeUpdate={(e) => onTimeUpdate(e.target.currentTime)} />
    );
};

export default AudioPlayer;