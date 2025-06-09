
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Users, Clock, UserPlus, Gavel, Volume2, VolumeX } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  country: string;
  isHost: boolean;
  isMuted: boolean;
  isOnStage: boolean;
  isCurrentSpeaker: boolean;
}

interface JoinSessionProps {
  sessionId: string;
  onBack: () => void;
}

export const JoinSession = ({ sessionId, onBack }: JoinSessionProps) => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Sarah Chen', country: 'Singapore', isHost: true, isMuted: false, isOnStage: true, isCurrentSpeaker: true },
    { id: '2', name: 'You', country: 'Your Country', isHost: false, isMuted: true, isOnStage: false, isCurrentSpeaker: false },
    { id: '3', name: 'Marcus Johnson', country: 'United States', isHost: false, isMuted: true, isOnStage: true, isCurrentSpeaker: false },
    { id: '4', name: 'Emma Thompson', country: 'United Kingdom', isHost: false, isMuted: true, isOnStage: false, isCurrentSpeaker: false }
  ]);
  
  const [timeLeft, setTimeLeft] = useState(420); // 7 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentRound, setCurrentRound] = useState('Opening Government');
  const [debateEnded, setDebateEnded] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState('');
  const [aiJudgment, setAiJudgment] = useState<any>(null);
  const [volume, setVolume] = useState(0.8);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0 && !debateEnded) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next speaker or end debate
            return 420; // Reset for next speaker
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft, debateEnded]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };

      setRecognition(recognition);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else if (isMuted && recognition) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const inviteToStage = (participantId: string) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, isOnStage: true } : p
    ));
  };

  const endDebate = () => {
    setDebateEnded(true);
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
    
    // Generate AI judgment
    setTimeout(() => {
      const judgment = {
        winner: 'Government',
        scores: {
          government: 85,
          opposition: 78
        },
        reasoning: "The Government team presented stronger logical arguments with better evidence support. Their case construction was more coherent and they effectively rebutted the Opposition's main points.",
        bestSpeaker: 'Sarah Chen',
        keyPoints: [
          "Strong opening case by Government",
          "Effective rebuttals in the middle speeches",
          "Opposition struggled with burden of proof"
        ]
      };
      setAiJudgment(judgment);
    }, 2000);
  };

  const stageParticipants = participants.filter(p => p.isOnStage);
  const audienceParticipants = participants.filter(p => !p.isOnStage);

  if (debateEnded && aiJudgment) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Sessions</span>
        </button>

        <div className="bg-card border rounded-lg p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto debate-gradient rounded-full flex items-center justify-center">
              <Gavel className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold">AI Judge's Decision</h1>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-2">Winner: {aiJudgment.winner}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Government:</span>
                    <span className="font-semibold">{aiJudgment.scores.government}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Opposition:</span>
                    <span className="font-semibold">{aiJudgment.scores.opposition}/100</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">Best Speaker</h3>
                <p className="text-blue-700 font-semibold">{aiJudgment.bestSpeaker}</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-6 text-left">
              <h4 className="font-semibold mb-3">Reasoning:</h4>
              <p className="text-muted-foreground mb-4">{aiJudgment.reasoning}</p>
              
              <h4 className="font-semibold mb-3">Key Points:</h4>
              <ul className="space-y-2">
                {aiJudgment.keyPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={onBack}
                className="px-6 py-3 debate-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Return to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Leave Session</span>
      </button>

      {/* Session Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">WSDC Practice - Technology Motions</h1>
            <p className="text-muted-foreground">Current Speaker: {currentRound}</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{formatTime(timeLeft)}</div>
              <div className="text-sm text-muted-foreground">Time Remaining</div>
            </div>
            
            <button
              onClick={endDebate}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              End Debate
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Stage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Debate Stage</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {stageParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    participant.isCurrentSpeaker
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{participant.name}</div>
                      <div className="text-sm text-muted-foreground">{participant.country}</div>
                      {participant.isHost && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Host</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {participant.isMuted ? (
                        <MicOff size={16} className="text-red-500" />
                      ) : (
                        <Mic size={16} className="text-green-500" />
                      )}
                      {participant.isCurrentSpeaker && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Speech Transcript */}
            {transcript && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2">Live Transcript:</h4>
                <p className="text-sm text-muted-foreground">{transcript}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Your Controls</h3>
            
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <div className="flex items-center space-x-2">
                <VolumeX size={20} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20"
                />
                <Volume2 size={20} />
              </div>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                {isMuted ? 'Microphone muted' : 'Microphone active'}
                {isRecording && !isMuted && ' - Recording'}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Users size={20} />
              <span>Audience ({audienceParticipants.length})</span>
            </h3>
            
            <div className="space-y-3">
              {audienceParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-xs text-muted-foreground">{participant.country}</div>
                  </div>
                  <button
                    onClick={() => inviteToStage(participant.id)}
                    className="p-1 hover:bg-muted rounded"
                    title="Invite to stage"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Motion */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Motion</h3>
            <p className="text-muted-foreground">
              "This House believes that social media platforms should be held legally liable for the spread of misinformation."
            </p>
          </div>

          {/* Round Information */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Round Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Format:</span>
                <span>WSDC</span>
              </div>
              <div className="flex justify-between">
                <span>Speaking Time:</span>
                <span>7 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Current Round:</span>
                <span className="font-semibold">{currentRound}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
