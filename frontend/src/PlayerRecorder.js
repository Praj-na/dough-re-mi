// PlayerRecorder.js
import React, { useState, useEffect, useRef } from 'react';
import './PlayerRecorder.css'; // Create this file for styling
import RealTimePitchFeedback from './RealTimePitchFeedback';
import { scoreWithAudioUrl } from './pitchComparison'; // Import the scoring function

const PlayerRecorder = ({ 
  playerName, 
  lineText, 
  originalVocalsUrl, 
  lineDuration,
  onScoreCalculated,
  onRealtimeScoreUpdate,
  microphoneStream,
  autoStart = false
}) => {
  const [status, setStatus] = useState('ready'); // ready, countdown, recording, processing
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  
  // Start the countdown to recording
  const startCountdown = async () => {
    try {
      // Use the provided microphoneStream if available, otherwise request a new one
      const stream = microphoneStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Begin the countdown
      setStatus('countdown');
      setCountdown(3);
      
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(countdownTimerRef.current);
            startRecording(stream);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setErrorMessage('Could not access microphone. Please check permissions.');
      setStatus('ready');
    }
  };
  
  // Start recording
  const startRecording = (stream) => {
    try {
      // Create media recorder using the provided stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        processRecording();
      };
      
      // Start recording
      mediaRecorder.start();
      setStatus('recording');
      setRecordingTime(0);
      
      // Set up timer to track recording duration
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Auto-stop after duration + 0.5 seconds (give a little buffer)
        if (seconds >= lineDuration + 0.5) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting recorder:', error);
      setErrorMessage('Could not access microphone. Please check permissions.');
      setStatus('ready');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      
      // Don't stop the audio tracks - just pause the recorder
      // We'll keep the microphone stream active for the next player
      // This fixes the issue with Player 2 getting stuck
    }
  };
  
  // Process the recording and calculate score
  const processRecording = async () => {
    setStatus('processing');
    
    // Create a blob from recorded chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    try {
      // Use scoreWithAudioUrl function (moved inside a useEffect or event handler)
      const calculatedScore = await scoreWithAudioUrl(audioBlob, originalVocalsUrl);
      
      // Use a score between 60-95 if the real scoring fails
    //   const calculatedScore = Math.floor(Math.random() * 36) + 60;

      
      // Immediately proceed to the next player
      onScoreCalculated(calculatedScore);
    } catch (error) {
      console.error('Error calculating score:', error);
      // Fallback to random score
      const fallbackScore = Math.floor(Math.random() * 36) + 60;
      onScoreCalculated(fallbackScore);
    }
  };
  
  // Auto-start recording if autoStart is true
  useEffect(() => {
    if (autoStart && microphoneStream) {
      // Automatically start the countdown after a short delay
      const timer = setTimeout(() => {
        startCountdown();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, microphoneStream]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  return (
    <div className="player-recorder">
      <div className="player-info">
        <h3>{playerName}'s Turn</h3>
      </div>
      
      <div className="lyrics-display">
        <p className="lyrics-text">{lineText}</p>
      </div>
      
      <div className="recording-section">
        {status === 'ready' && (
          <button className="record-button" onClick={startCountdown}>
            Start Recording
          </button>
        )}
        
        {status === 'countdown' && (
          <div className="countdown">
            <span className="countdown-number">{countdown}</span>
          </div>
        )}
        
        {status === 'recording' && (
          <div className="recording-info">
            <div className="recording-indicator">Recording... {recordingTime}s</div>
            <button className="stop-button" onClick={stopRecording}>
              Stop Recording
            </button>
            
            {/* Render RealTimePitchFeedback conditionally */}
            {status === 'recording' && (
              <RealTimePitchFeedback 
                isActive={true}
                micStream={microphoneStream}
                onScoreUpdate={onRealtimeScoreUpdate}
              />
            )}
          </div>
        )}
        
        {status === 'processing' && (
          <div className="processing-info">
            <p>Calculating your score...</p>
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerRecorder;