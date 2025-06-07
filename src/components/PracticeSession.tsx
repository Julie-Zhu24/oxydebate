
import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Bot, Square, MessageSquare } from 'lucide-react';
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

  const generateFeedback = () => {
    const skillFeedback = {
      rebuttal: [
        `Strong work on ${config.skill}! You effectively identified and addressed key opposing arguments.`,
        `Good rebuttal structure. Next time, try using more "even if" frameworks to strengthen your responses.`,
        `Your rebuttals were well-targeted. Consider adding more impact comparison to show why your responses matter more.`
      ],
      argumentation: [
        `Excellent argumentation! Your logical flow was clear and compelling.`,
        `Good argument structure. Try adding more concrete examples to make your points more persuasive.`,
        `Your reasoning was sound. Consider strengthening the link between your claims and their broader impacts.`
      ],
      weighing: [
        `Great comparative analysis! You effectively showed why your impacts matter more.`,
        `Good weighing attempt. Focus more on magnitude, probability, and timeframe comparisons.`,
        `Strong weighing framework. Try to engage more directly with opposing team's impact claims.`
      ],
      modeling: [
        `Excellent model definition! You clearly established the scope and parameters of the motion.`,
        `Good modeling attempt. Be more specific about implementation details and practical constraints.`,
        `Your framework was solid. Consider anticipating and pre-empting opposition definitional challenges.`
      ],
      'case-building': [
        `Strong case construction! Your arguments built well on each other.`,
        `Good thematic organization. Try to make your arguments more mutually reinforcing.`,
        `Solid case structure. Consider how each argument strengthens your overall narrative.`
      ],
      POI: [
        `Good strategic interventions! You timed your points well and targeted key weaknesses.`,
        `Solid POI strategy. Make your questions more concise and harder to deflect.`,
        `Effective use of POIs. Try to create more moments that expose fundamental flaws.`
      ],
      summary: [
        `Excellent summary speech! You crystallized the key issues clearly.`,
        `Good crystallization. Focus more on explaining why your side won the crucial clashes.`,
        `Strong summary structure. Try to be more explicit about voting issues and impact comparison.`
      ]
    };

    const generalFeedback = [
      `Your delivery was confident and your structure was easy to follow.`,
      `Good use of signposting and clear transitions between points.`,
      `Strong opening and closing - you framed the debate well.`,
      `Effective use of examples and evidence to support your arguments.`
    ];

    const skillSpecific = skillFeedback[config.skill] || ['Great work on your speech!'];
    const general = generalFeedback[Math.floor(Math.random() * generalFeedback.length)];
    const specific = skillSpecific[Math.floor(Math.random() * skillSpecific.length)];

    return `${specific} ${general}`;
  };

  const startSession = () => {
    setSessionStarted(true);
    setIsRunning(true);
    setIsRecording(true);
    
    // Set debate context for non-PM speakers
    if (config.speaker !== 'PM' && config.speaker !== 'MG') {
      const context = getDebateContext();
      if (Array.isArray(context) && context.length > 0) {
        setDebateContext(context.join('\n'));
      }
    }
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
    setDebateContext('');
    setFeedback('');
  };

  const handleSessionEnd = () => {
    setIsRecording(false);
    setSessionEnded(true);
    
    // Generate AI feedback
    const generatedFeedback = generateFeedback();
    setFeedback(generatedFeedback);
    
    // Save to practice history
    const practiceRecord = {
      date: new Date(),
      format: config.format,
      topic: config.topic,
      speaker: config.speaker,
      skill: config.skill,
      duration: config.timeLimit,
      timeUsed: config.timeLimit * 60 - timeLeft,
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

      {/* Debate Context for Non-PM Speakers */}
      {debateContext && !sessionEnded && (
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
            ) : (
              <button
                onClick={resetSession}
                className="flex items-center space-x-2 px-8 py-4 debate-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <RotateCcw size={24} />
                <span>Practice Again</span>
              </button>
            )}
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

      {/* AI Feedback */}
      {feedback && sessionEnded && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI Coach Feedback</h3>
              <p className="text-muted-foreground mb-4">{feedback}</p>
              <div className="text-sm">
                <strong>Time Used:</strong> {formatTime(config.timeLimit * 60 - timeLeft)} / {formatTime(config.timeLimit * 60)}
              </div>
            </div>
          </div>
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
