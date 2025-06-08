import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Bot, Square, MessageSquare, Save, X, History, Mic, MicOff } from 'lucide-react';
import { DebateFormat, Speaker, Skill } from './AIPractice';

interface PracticeConfig {
  format: DebateFormat;
  topic: string;
  speaker: Speaker;
  skill: Skill;
  timeLimit: number;
}

interface PracticeSessionProps {
  config: PracticeConfig;
  onBack: () => void;
}

interface FeedbackData {
  score: number;
  strengths: string;
  improvements: string;
  specific: string;
  timing: string;
  timeUsed: string;
  totalTime: string;
}

export const PracticeSession = ({ config, onBack }: PracticeSessionProps) => {
  const [timeLeft, setTimeLeft] = useState(config.timeLimit * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [debateContext, setDebateContext] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [transcript, setTranscript] = useState('');
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Set debate context immediately for non-PM speakers
    if (config.speaker !== 'PM' && config.speaker !== 'MG') {
      const context = getDebateContext();
      if (Array.isArray(context) && context.length > 0) {
        setDebateContext(context.join('\n'));
      }
    }
  }, [config.speaker]);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setRecognition(recognition);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      handleSessionEnd();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDebateContext = () => {
    const contexts = {
      PM: '',
      LO: [
        '• PM established government benefits social media regulation',
        '• PM argued regulation prevents misinformation spread',
        '• PM claimed economic benefits from safer digital environment'
      ],
      DPM: [
        '• PM outlined regulation framework and benefits',
        '• LO argued regulation stifles innovation and free speech',
        '• LO claimed enforcement would be discriminatory'
      ],
      DLO: [
        '• Government case: regulation protects users and democracy',
        '• Opposition rebuttal: regulation threatens fundamental rights',
        '• DPM reinforced with international examples of success'
      ],
      GW: [
        '• Opening teams clashed on innovation vs. safety',
        '• Government emphasized democratic protection',
        '• Opposition focused on implementation concerns',
        '• Key clash: effectiveness of regulatory frameworks'
      ],
      OW: [
        '• Government case built on user protection and democratic integrity',
        '• Opposition established free speech and innovation concerns',
        '• Opening teams agreed regulation has trade-offs',
        '• GW argued government oversight prevents tech monopolies'
      ],
      GR: [
        '• Core clash: safety vs. freedom in digital spaces',
        '• Opposition emphasized slippery slope to censorship',
        '• Government proved necessity through harm examples',
        '• Closing teams debated practical implementation'
      ],
      OR: [
        '• Government built comprehensive case for necessary regulation',
        '• Opposition proved fundamental rights violations',
        '• Both sides agreed on problem, disagreed on solutions',
        '• GR emphasized democratic accountability in tech'
      ],
      MG: '',
      MO: [
        '• MG argued economic benefits outweigh costs',
        '• MG established clear implementation framework'
      ]
    };

    return contexts[config.speaker] || [];
  };

  const generateDetailedFeedback = (): FeedbackData => {
    const timeUsed = config.timeLimit * 60 - timeLeft;
    const timePercentage = (timeUsed / (config.timeLimit * 60)) * 100;

    const skillFeedback = {
      rebuttal: {
        strengths: "You demonstrated strong analytical skills by systematically addressing opposing arguments. Your use of 'even if' frameworks showed sophisticated defensive strategy.",
        improvements: "Consider spending more time on impact comparison - showing why your rebuttals matter more than their original arguments. Try to allocate roughly 30 seconds per major rebuttal point.",
        specific: "Your rebuttal on innovation was particularly effective because you provided concrete counter-examples. Next time, try to anticipate their likely responses to your rebuttals.",
        score: 7.5
      },
      argumentation: {
        strengths: "Your argument structure was clear with distinct claim-warrant-impact chains. Good use of evidence and examples to support your points.",
        improvements: "Work on making your impact links more explicit - explain clearly how your arguments lead to the consequences you claim. Consider using more comparative language.",
        specific: "Your first argument about user protection was well-developed, but you could strengthen it by quantifying the scale of the problem you're solving.",
        score: 8.0
      },
      weighing: {
        strengths: "Excellent comparative analysis using magnitude, probability, and timeframe. You clearly established why your impacts matter more.",
        improvements: "Try to engage more directly with their specific impact claims rather than just presenting your own framework. Address why their weighing mechanism is flawed.",
        specific: "Your weighing on magnitude was convincing, but you could have been more explicit about probability - why are your impacts more likely to occur?",
        score: 7.8
      }
    };

    const currentSkill = skillFeedback[config.skill] || {
      strengths: "Good overall structure and delivery.",
      improvements: "Focus on clearer signposting and stronger conclusion.",
      specific: "Continue practicing to improve your confidence and flow.",
      score: 7.0
    };

    const timingFeedback = timePercentage > 95 ? "Excellent time management - you used almost all available time effectively." :
                          timePercentage > 80 ? "Good time usage, though you could have used a bit more time to develop your points." :
                          timePercentage > 50 ? "You finished early - try to use more of your allocated time to strengthen your arguments." :
                          "You finished very early - work on developing your arguments more fully and using your full time allocation.";

    return {
      score: currentSkill.score,
      strengths: currentSkill.strengths,
      improvements: currentSkill.improvements,
      specific: currentSkill.specific,
      timing: timingFeedback,
      timeUsed: formatTime(timeUsed),
      totalTime: formatTime(config.timeLimit * 60)
    };
  };

  const startSession = () => {
    setSessionStarted(true);
    setIsRunning(true);
    setIsRecording(true);
    setTranscript('');
    
    if (recognition) {
      recognition.start();
    }
  };

  const endSpeechEarly = () => {
    setIsRunning(false);
    setIsRecording(false);
    if (recognition) {
      recognition.stop();
    }
    handleSessionEnd();
  };

  const pauseSession = () => {
    setIsRunning(!isRunning);
    if (!isRunning && recognition) {
      recognition.start();
    } else if (isRunning && recognition) {
      recognition.stop();
    }
  };

  const resetSession = () => {
    setTimeLeft(config.timeLimit * 60);
    setIsRunning(false);
    setIsRecording(false);
    setSessionStarted(false);
    setSessionEnded(false);
    setFeedback(null);
    setTranscript('');
    setShowSaveOptions(false);
    
    if (recognition) {
      recognition.stop();
    }
  };

  const handleSessionEnd = () => {
    setIsRecording(false);
    setSessionEnded(true);
    
    if (recognition) {
      recognition.stop();
    }
    
    // Generate feedback
    const generatedFeedback = generateDetailedFeedback();
    setFeedback(generatedFeedback);
    setShowSaveOptions(true);
  };

  const savePractice = () => {
    const practiceRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      format: config.format,
      topic: config.topic,
      speaker: config.speaker,
      skill: config.skill,
      duration: config.timeLimit,
      timeUsed: config.timeLimit * 60 - timeLeft,
      completed: timeLeft === 0,
      transcript,
      feedback,
      saved: true
    };
    
    const existingHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
    existingHistory.push(practiceRecord);
    localStorage.setItem('practiceHistory', JSON.stringify(existingHistory));
    
    setShowSaveOptions(false);
  };

  const dismissPractice = () => {
    setShowSaveOptions(false);
    resetSession();
  };

  const getSkillTips = () => {
    const tips = {
      rebuttal: ['Address the strongest opposing arguments', 'Use the "Even if" framework', 'Provide counter-evidence'],
      argumentation: ['Use clear claim-warrant-impact structure', 'Provide concrete examples', 'Build logical chains'],
      weighing: ['Compare magnitude, probability, and timeframe', 'Use comparative language', 'Establish frameworks for evaluation'],
      modeling: ['Define key terms clearly', 'Set reasonable parameters', 'Explain practical implementation'],
      'case-building': ['Structure with clear themes', 'Ensure arguments are mutually reinforcing', 'Build to your strongest points'],
      POI: ['Time your interventions strategically', 'Keep questions concise', 'Aim to expose weaknesses'],
      summary: ['Crystallize key clashes', 'Highlight your side\'s strongest arguments', 'Provide clear voting issues']
    };
    
    return tips[config.skill] || [];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Configuration</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Practice Session</h1>
          <p className="text-sm text-muted-foreground">
            {config.format} • {config.speaker} • {config.skill}
          </p>
        </div>
        <div></div>
      </div>

      {/* Topic Display */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">Motion</h2>
        <p className="text-xl font-bold text-primary">{config.topic}</p>
      </div>

      {/* Debate Context - Always visible for non-PM speakers */}
      {debateContext && (
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <MessageSquare size={18} />
            <span>Debate So Far</span>
          </h3>
          <div className="text-sm space-y-1">
            {debateContext.split('\n').map((line, index) => (
              <div key={index} className="text-muted-foreground">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Timer and Controls */}
      <div className="bg-card border rounded-lg p-6">
        <div className="text-center space-y-6">
          <div className="text-6xl font-mono font-bold text-primary">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center space-x-4">
            {!sessionStarted ? (
              <button
                onClick={startSession}
                className="flex items-center space-x-2 px-8 py-4 debate-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Play size={24} />
                <span>Start Practice</span>
              </button>
            ) : !sessionEnded ? (
              <>
                <button
                  onClick={pauseSession}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {isRunning ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isRunning ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  onClick={endSpeechEarly}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Square size={20} />
                  <span>End Speech</span>
                </button>
                
                <button
                  onClick={resetSession}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-muted-foreground text-muted-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </button>
              </>
            ) : !showSaveOptions ? (
              <button
                onClick={resetSession}
                className="flex items-center space-x-2 px-8 py-4 debate-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <RotateCcw size={24} />
                <span>Practice Again</span>
              </button>
            ) : null}
          </div>

          {sessionStarted && !sessionEnded && (
            <div className="flex items-center justify-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              {isListening ? <Mic className="text-red-500" size={16} /> : <MicOff className="text-gray-400" size={16} />}
              <span className="text-sm text-muted-foreground">
                {isListening ? 'Listening...' : 'Not listening'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Speech Transcript */}
      {transcript && sessionEnded && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center space-x-2">
            <MessageSquare size={18} />
            <span>Your Speech Transcript</span>
          </h3>
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
            {transcript || "No speech detected. Please check your microphone permissions."}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && sessionEnded && (
        <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-xl p-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={24} />
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-accent">AI Coach Analysis</h3>
                <div className="flex items-center space-x-2 bg-accent/10 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-accent">Overall Score:</span>
                  <span className="text-2xl font-bold text-accent">{feedback.score}/10</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Strengths</span>
                  </h4>
                  <p className="text-sm text-green-700 leading-relaxed">{feedback.strengths}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Areas for Improvement</span>
                  </h4>
                  <p className="text-sm text-blue-700 leading-relaxed">{feedback.improvements}</p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Specific to Your {config.skill} Skills</span>
                </h4>
                <p className="text-sm text-purple-700 leading-relaxed">{feedback.specific}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center space-x-2">
                  <Clock size={16} />
                  <span>Time Management</span>
                </h4>
                <p className="text-sm text-orange-700 mb-2">{feedback.timing}</p>
                <div className="flex items-center space-x-4 text-xs text-orange-600">
                  <span>Time Used: <strong>{feedback.timeUsed}</strong></span>
                  <span>Total Time: <strong>{feedback.totalTime}</strong></span>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-5">
                <h4 className="font-semibold text-accent mb-3">Next Steps</h4>
                <p className="text-sm text-muted-foreground">
                  Keep practicing your {config.skill} skills with these insights in mind. Focus on the improvement areas 
                  and continue building on your strengths. Regular practice will help you develop into a stronger debater.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save/Dismiss Options */}
      {showSaveOptions && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={savePractice}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Save size={20} />
            <span>Save Practice</span>
          </button>
          <button
            onClick={dismissPractice}
            className="flex items-center space-x-2 px-6 py-3 border-2 border-muted-foreground text-muted-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
          >
            <X size={20} />
            <span>Dismiss Practice</span>
          </button>
        </div>
      )}

      {/* Skill Tips */}
      {!sessionEnded && (
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Tips for {config.skill}</h3>
          <ul className="space-y-2">
            {getSkillTips().map((tip, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
