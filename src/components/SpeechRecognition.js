import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';

function SpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = event => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setTranscript(finalTranscript);
    };

    recognitionRef.current.onerror = event => {
      console.error(event);
    };

    recognitionRef.current.onend = () => {
      // Transfer the recorded audio to text
      const audioBlob = new Blob(chunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => setTranscript(data.transcript))
        .catch(error => console.error(error));
    };
  }, []);

  const [chunks, setChunks] = useState([]);

  const handleStartRecording = () => {
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    recognitionRef.current.continuous = false; // Stop listening for speech input
    recognitionRef.current.stop();
    setIsRecording(false);
  };

  const handleAudioDataAvailable = event => {
    setChunks(prevChunks => [...prevChunks, event.data]);
  };

  const handleSaveTranscript = () => {
    const file = new File([transcript], 'note.txt', { type: 'text/plain;charset=utf-8' });
    saveAs(file);
  };

  return (
    <div>
      <button className="custom-button" onClick={handleStartRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button className="custom-button" onClick={handleStopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <button  className="custom-button" onClick={handleSaveTranscript} disabled={!transcript}>
        Save Notes
      </button>
      <div className="transcript-container">{transcript}</div>

      <audio src={window.URL.createObjectURL(new Blob(chunks))} controls />
    </div>
  );
}

export default SpeechRecognition;
