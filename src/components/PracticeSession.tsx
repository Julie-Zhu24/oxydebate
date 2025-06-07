
import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Bot, Square, MessageSquare, Save, X, History } from 'lucide-react';
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
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [debateContext, setDebateContext] = useState('');
  const [feedback, setFeedback] = useState('');
  const [transcript, setTranscript] = useState('');
  const [showSaveOptions, setShowSaveOptions] = useState(false);

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

  const generateTranscript = () => {
    // Simulate speech-to-text conversion
    const sampleTranscripts = {
      rebuttal: "Thank you. I'll begin by addressing the key arguments from the previous speaker. First, on the claim that regulation stifles innovation - this fundamentally misunderstands how regulatory frameworks actually work. We see in countries like Germany and France that smart regulation actually encourages innovation by creating clear guidelines. Second, the opposition argues about free speech concerns, but they fail to recognize that unregulated platforms actually silence marginalized voices through algorithmic bias and harassment. Third, regarding implementation challenges...",
      argumentation: "Honorable judges, I stand before you today to argue that social media regulation is not just beneficial, but absolutely necessary for our democratic society. My first argument centers on the protection of vulnerable users. Studies show that unregulated platforms contribute to rising rates of cyberbullying and mental health issues, particularly among teenagers. My second argument focuses on democratic integrity - misinformation campaigns on unregulated platforms have undermined election processes globally...",
      weighing: "Looking at this debate, we need to focus on what matters most. Both sides agree there are problems with current social media use. The key question is: which approach better serves society? The government's regulation approach provides immediate protection for millions of users, while the opposition's free-market solution offers only theoretical future benefits. When we weigh magnitude - government regulation affects all users positively, while opposition concerns affect only a small subset of content creators...",
    };

    return sampleTranscripts[config.skill] || "Thank you for this opportunity to speak. I will address the key points raised in this debate and present my arguments clearly and logically...";
  };

  const generateDetailedFeedback = () => {
    const timeUsed = config.timeLimit * 60 - timeLeft;
    const timePercentage = (timeUsed / (config.timeLimit * 60)) * 100;

    const skillFeedback = {
      rebuttal: {
        strengths: "You demonstrated strong analytical skills by systematically addressing opposing arguments. Your use of 'even if' frameworks showed sophisticated defensive strategy.",
        improvements: "Consider spending more time on impact comparison - showing why your rebuttals matter more than their original arguments. Try to allocate roughly 30 seconds per major rebuttal point.",
        specific: "Your rebuttal on innovation was particularly effective because you provided concrete counter-examples. Next time, try to anticipate their likely responses to your rebuttals."
      },
      argumentation: {
        strengths: "Your argument structure was clear with distinct claim-warrant-impact chains. Good use of evidence and examples to support your points.",
        improvements: "Work on making your impact links more explicit - explain clearly how your arguments lead to the consequences you claim. Consider using more comparative language.",
        specific: "Your first argument about user protection was well-developed, but you could strengthen it by quantifying the scale of the problem you're solving."
      },
      weighing: {
        strengths: "Excellent comparative analysis using magnitude, probability, and timeframe. You clearly established why your impacts matter more.",
        improvements: "Try to engage more directly with their specific impact claims rather than just presenting your own framework. Address why their weighing mechanism is flawed.",
        specific: "Your weighing on magnitude was convincing, but you could have been more explicit about probability - why are your impacts more likely to occur?"
      }
    };

    const currentSkill = skillFeedback[config.skill] || {
      strengths: "Good overall structure and delivery.",
      improvements: "Focus on clearer signposting and stronger conclusion.",
      specific: "Continue practicing to improve your confidence and flow."
    };

    const timingFeedback = timePercentage > 95 ? "Excellent time management - you used almost all available time effectively." :
                          timePercentage > 80 ? "Good time usage, though you could have used a bit more time to develop your points." :
                          timePercentage > 50 ? "You finished early - try to use more of your allocated time to strengthen your arguments." :
                          "You finished very early - work on developing your arguments more fully and using your full time allocation.";

    return `**Strengths:** ${currentSkill.strengths}

**Areas for Improvement:** ${currentSkill.improvements}

**Specific to Your Speech:** ${currentSkill.specific}

**Time Management:** ${timingFeedback} (Used ${formatTime(timeUsed)} of ${formatTime(config.timeLimit * 60)})

**Overall Assessment:** You're developing strong ${config.skill} skills. Focus on the improvements above and continue practicing regularly to see significant progress.`;
  };

  const startSession = () => {
    setSessionStarted(true);
    setIsRunning(true);
    setIsRecording(true);
  };

  const endSpeechEarly = () => {
    setIsRunning(false);
    setIsRecording(false);
    handleSessionEnd();
  };

  const pauseSession = () => {
    setIsRunning(!isRunning);
  };

  const resetSession = () => {
    setTimeLeft(config.timeLimit * 60);
    setIsRunning(false);
    setIsRecording(false);
    setSessionStarted(false);
    setSessionEnded(false);
    setFeedback('');
    setTranscript('');
    setShowSaveOptions(false);
  };

  const handleSessionEnd = () => {
    setIsRecording(false);
    setSessionEnded(true);
    
    // Generate transcript and feedback
    const generatedTranscript = generateTranscript();
    const generatedFeedback = generateDetailedFeedback();
    setTranscript(generatedTranscript);
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
    // Show success message or redirect
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
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isRecording ? 'Recording...' : 'Paused'}
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
            {transcript}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {feedback && sessionEnded && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-4">AI Coach Feedback</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {feedback}
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
