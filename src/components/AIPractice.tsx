
import { useState } from 'react';
import { Bot, Clock, Users, Target, ArrowRight, Shuffle, Edit, History } from 'lucide-react';
import { TopicSelector } from './TopicSelector';
import { PracticeSession } from './PracticeSession';
import { PracticeHistory } from './PracticeHistory';

export type DebateFormat = 'WSDC' | 'PF';
export type Speaker = 'PM' | 'LO' | 'DPM' | 'DLO' | 'GW' | 'OW' | 'GR' | 'OR' | 'MG' | 'MO';
export type Skill = 'rebuttal' | 'argumentation' | 'weighing' | 'modeling' | 'case-building' | 'POI' | 'summary';

export interface PracticeConfig {
  format: DebateFormat;
  topic: string;
  speaker: Speaker;
  skill: Skill;
  timeLimit: number;
}

export const AIPractice = () => {
  const [currentStep, setCurrentStep] = useState<'config' | 'topic' | 'practice' | 'history'>('config');
  const [config, setConfig] = useState<Partial<PracticeConfig>>({});

  const speakers = {
    WSDC: [
      { id: 'PM' as Speaker, label: 'Prime Minister', description: 'Opening Government (1st)' },
      { id: 'LO' as Speaker, label: 'Leader of Opposition', description: 'Opening Opposition (1st)' },
      { id: 'DPM' as Speaker, label: 'Deputy Prime Minister', description: 'Opening Government (2nd)' },
      { id: 'DLO' as Speaker, label: 'Deputy Leader of Opposition', description: 'Opening Opposition (2nd)' },
      { id: 'GW' as Speaker, label: 'Government Whip', description: 'Closing Government (1st)' },
      { id: 'OW' as Speaker, label: 'Opposition Whip', description: 'Closing Opposition (1st)' },
      { id: 'GR' as Speaker, label: 'Government Reply', description: 'Closing Government (2nd)' },
      { id: 'OR' as Speaker, label: 'Opposition Reply', description: 'Closing Opposition (2nd)' },
    ],
    PF: [
      { id: 'MG' as Speaker, label: 'Member Government', description: 'First Pro Speaker' },
      { id: 'MO' as Speaker, label: 'Member Opposition', description: 'First Con Speaker' },
      { id: 'GW' as Speaker, label: 'Government Whip', description: 'Final Pro Speaker' },
      { id: 'OW' as Speaker, label: 'Opposition Whip', description: 'Final Con Speaker' },
    ],
  };

  const skills = [
    { id: 'argumentation' as Skill, label: 'Argumentation', description: 'Building strong logical arguments' },
    { id: 'rebuttal' as Skill, label: 'Rebuttal', description: 'Attacking opponent arguments' },
    { id: 'weighing' as Skill, label: 'Weighing', description: 'Comparative impact analysis' },
    { id: 'modeling' as Skill, label: 'Modeling', description: 'Defining the motion and framework' },
    { id: 'case-building' as Skill, label: 'Case Building', description: 'Constructing comprehensive cases' },
    { id: 'POI' as Skill, label: 'Points of Information', description: 'Strategic interventions' },
    { id: 'summary' as Skill, label: 'Summary', description: 'Crystallizing key issues' },
  ];

  const handleTopicSelected = (topic: string) => {
    setConfig(prev => ({ ...prev, topic }));
    setCurrentStep('practice');
  };

  if (currentStep === 'history') {
    return (
      <PracticeHistory
        onBack={() => setCurrentStep('config')}
      />
    );
  }

  if (currentStep === 'topic') {
    return (
      <TopicSelector
        onTopicSelected={handleTopicSelected}
        onBack={() => setCurrentStep('config')}
      />
    );
  }

  if (currentStep === 'practice' && config.topic) {
    return (
      <PracticeSession
        config={config as PracticeConfig}
        onBack={() => setCurrentStep('config')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 debate-gradient rounded-xl flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold">AI Practice Arena</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Practice with our advanced AI coach and improve your debate skills
        </p>
        <button
          onClick={() => setCurrentStep('history')}
          className="flex items-center space-x-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <History size={18} />
          <span>My Practice History</span>
        </button>
      </div>

      <div className="grid gap-8">
        {/* Format Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Target size={20} />
            <span>Select Debate Format</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(['WSDC', 'PF'] as DebateFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setConfig(prev => ({ ...prev, format }))}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  config.format === format
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">
                  {format === 'WSDC' ? 'World Schools (WSDC)' : 'Public Forum (PF)'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {format === 'WSDC'
                    ? 'British Parliamentary style with 8 speakers total'
                    : 'American style with 2 speakers per side'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Speaker Selection */}
        {config.format && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Users size={20} />
              <span>Choose Speaker Position</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {speakers[config.format].map((speaker) => (
                <button
                  key={speaker.id}
                  onClick={() => setConfig(prev => ({ ...prev, speaker: speaker.id }))}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    config.speaker === speaker.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <h4 className="font-semibold">{speaker.label}</h4>
                  <p className="text-sm text-muted-foreground">{speaker.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Skill Selection */}
        {config.speaker && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Target size={20} />
              <span>Focus Skill</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setConfig(prev => ({ ...prev, skill: skill.id }))}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    config.skill === skill.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <h4 className="font-medium">{skill.label}</h4>
                  <p className="text-xs text-muted-foreground">{skill.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Limit */}
        {config.skill && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Clock size={20} />
              <span>Speech Duration</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {[3, 5, 7, 8].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setConfig(prev => ({ ...prev, timeLimit: minutes }))}
                  className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                    config.timeLimit === minutes
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {minutes} minutes
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Button */}
        {config.timeLimit && (
          <div className="flex justify-center pt-6">
            <button
              onClick={() => setCurrentStep('topic')}
              className="flex items-center space-x-2 px-8 py-4 debate-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <span>Choose Topic</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
