
import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Bot, Mic, MicOff } from 'lucide-react';
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

export const PracticeSession = ({ config, onBack }: PracticeSessionProps) => {
  const [timeLeft, setTimeLeft] = useState(config.timeLimit * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiCoachResponse, setAiCoachResponse] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);

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

  const startSession = () => {
    setSessionStarted(true);
    setIsRunning(true);
    setIsRecording(true);
    
    // Generate AI coach opening
    const openingMessages = [
      `Great! You're practicing ${config.skill} as the ${config.speaker}. Remember to focus on clear structure and compelling arguments.`,
      `Welcome to your practice session! As the ${config.speaker}, your role is crucial. Show me your best ${config.skill} skills!`,
      `Ready to debate! For this ${config.skill} practice, remember to engage with the motion directly and build strong logical chains.`
    ];
    
    setAiCoachResponse(openingMessages[Math.floor(Math.random() * openingMessages.length)]);
  };

  const pauseSession = () => {
    setIsRunning(!isRunning);
  };

  const resetSession = () => {
    setTimeLeft(config.timeLimit * 60);
    setIsRunning(false);
    setIsRecording(false);
    setSessionStarted(false);
    setAiCoachResponse('');
  };

  const handleSessionEnd = () => {
    setIsRecording(false);
    
    // Generate AI feedback
    const feedbackMessages = [
      `Excellent work! Your ${config.skill} skills showed real improvement. Focus on strengthening your impact analysis next time.`,
      `Great session! I noticed strong logical flow in your arguments. Consider adding more concrete examples to enhance persuasiveness.`,
      `Well done! Your speech structure was clear. For your next practice, try to incorporate more comparative weighing between arguments.`
    ];
    
    setAiCoachResponse(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);
    
    // Save to practice history (mock)
    const practiceRecord = {
      date: new Date(),
      format: config.format,
      topic: config.topic,
      speaker: config.speaker,
      skill: config.skill,
      duration: config.timeLimit,
      completed: timeLeft === 0
    };
    
    const existingHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
    existingHistory.push(practiceRecord);
    localStorage.setItem('practiceHistory', JSON.stringify(existingHistory));
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
          <span>Back to Topics</span>
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
            ) : (
              <>
                <button
                  onClick={pauseSession}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {isRunning ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isRunning ? 'Pause' : 'Resume'}</span>
                </button>
                
                <button
                  onClick={resetSession}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-muted-foreground text-muted-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  <RotateCcw size={20} />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>

          {sessionStarted && (
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isRecording ? 'Recording...' : 'Paused'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Coach */}
      {aiCoachResponse && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI Coach</h3>
              <p className="text-muted-foreground">{aiCoachResponse}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Tips */}
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
    </div>
  );
};
