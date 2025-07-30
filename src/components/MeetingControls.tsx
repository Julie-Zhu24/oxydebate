import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MeetingControlsProps {
  isHost: boolean;
  sessionId: string;
  onSpeakerAssignment: (propSpeakers: string[], oppSpeakers: string[]) => void;
  onResultSubmission: (result: 'prop_wins' | 'opp_wins' | 'tie') => void;
}

export const MeetingControls = ({ 
  isHost, 
  sessionId, 
  onSpeakerAssignment, 
  onResultSubmission 
}: MeetingControlsProps) => {
  // Timer state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Speaker assignment state
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false);
  const [propSpeakers, setPropSpeakers] = useState(['', '', '', '']);
  const [oppSpeakers, setOppSpeakers] = useState(['', '', '', '']);
  
  // Result submission state
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<'prop_wins' | 'opp_wins' | 'tie' | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => setIsRunning(true);
  const handlePauseTimer = () => setIsRunning(false);
  const handleResetTimer = () => {
    setIsRunning(false);
    setTime(0);
  };

  const handleSpeakerSubmit = () => {
    if (!propSpeakers[0] || !oppSpeakers[0]) {
      alert('Please fill in at least the first speakers for both sides');
      return;
    }
    onSpeakerAssignment(propSpeakers, oppSpeakers);
    setShowSpeakerDialog(false);
  };

  const handleResultSubmit = () => {
    if (!selectedResult) {
      alert('Please select a result');
      return;
    }
    onResultSubmission(selectedResult);
    setShowResultDialog(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Timer Display - Visible to everyone */}
        <div className="flex items-center gap-2">
          <div className="text-lg font-mono font-bold min-w-[60px]">
            {formatTime(time)}
          </div>
        </div>

        {/* Host-only controls */}
        {isHost && (
          <>
            <Separator orientation="vertical" className="h-8" />
            
            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartTimer}
                disabled={isRunning}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseTimer}
                disabled={!isRunning}
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetTimer}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Speaker Assignment */}
            <Dialog open={showSpeakerDialog} onOpenChange={setShowSpeakerDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Assign Speakers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign Speaker Roles</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Proposition Team</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {propSpeakers.map((speaker, index) => (
                        <div key={index}>
                          <Label htmlFor={`prop-${index}`}>
                            {index === 0 ? '1st Speaker *' : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Speaker`}
                          </Label>
                          <Input
                            id={`prop-${index}`}
                            value={speaker}
                            onChange={(e) => {
                              const newSpeakers = [...propSpeakers];
                              newSpeakers[index] = e.target.value;
                              setPropSpeakers(newSpeakers);
                            }}
                            placeholder="Enter speaker name"
                            required={index === 0}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Opposition Team</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {oppSpeakers.map((speaker, index) => (
                        <div key={index}>
                          <Label htmlFor={`opp-${index}`}>
                            {index === 0 ? '1st Speaker *' : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Speaker`}
                          </Label>
                          <Input
                            id={`opp-${index}`}
                            value={speaker}
                            onChange={(e) => {
                              const newSpeakers = [...oppSpeakers];
                              newSpeakers[index] = e.target.value;
                              setOppSpeakers(newSpeakers);
                            }}
                            placeholder="Enter speaker name"
                            required={index === 0}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowSpeakerDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSpeakerSubmit}>
                    Save Speaker Assignments
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Result Submission */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  Declare Result
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Declare Debate Result</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label>Select the winner:</Label>
                  <Select value={selectedResult || ''} onValueChange={(value) => setSelectedResult(value as 'prop_wins' | 'opp_wins' | 'tie')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prop_wins">Proposition Wins</SelectItem>
                      <SelectItem value="opp_wins">Opposition Wins</SelectItem>
                      <SelectItem value="tie">Tie/Draw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleResultSubmit}>
                    Submit Result
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};