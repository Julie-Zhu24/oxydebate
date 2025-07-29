import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, Globe, Star, Calendar, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { JoinSession } from './JoinSession';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

interface PracticeMatch {
  id: string;
  creator_user_id: string;
  opponent_user_id?: string;
  topic_id?: string;
  topic_title: string;
  status: string;
  difficulty: string;
  start_time?: string;
  end_time?: string;
  winner_user_id?: string;
  created_at: string;
  creator_profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
    rating: number;
  };
  opponent_profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
    rating: number;
  };
}

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

export const RealGlobalPractice = () => {
  const [activeTab, setActiveTab] = useState<'find' | 'create' | 'attended'>('find');
  const [matches, setMatches] = useState<PracticeMatch[]>([]);
  const [attendedSessions, setAttendedSessions] = useState<PracticeMatch[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  
  // Create session form
  const [newSession, setNewSession] = useState({
    topic_id: '',
    topic_title: '',
    difficulty: 'beginner',
    start_time: '',
    description: ''
  });
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchTopics();
    fetchAttendedSessions();
  }, []);

  const fetchMatches = async () => {
    try {
      console.warn('🔍 FETCHING MATCHES - check this log!');
      const { data, error } = await supabase
        .from('practice_matches')
        .select(`
          *,
          creator_profile:profiles!practice_matches_creator_user_id_fkey (
            display_name,
            username,
            avatar_url,
            rating
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw matches data:', data);
      
      // Filter out sessions that have expired (2 hours after start time)
      // Only show expired sessions if user created or joined them
      const filteredMatches = (data as any)?.filter((match: PracticeMatch) => {
        if (!match.start_time) return true;
        
        const startTime = new Date(match.start_time);
        const now = new Date();
        const sessionExpired = now.getTime() - startTime.getTime() > 2 * 60 * 60 * 1000; // 2 hours
        
        console.log('Session filter check:', {
          id: match.id,
          start_time: match.start_time,
          startTime: startTime.toISOString(),
          now: now.toISOString(),
          sessionExpired,
          isCreatorOrOpponent: match.creator_user_id === user?.id || match.opponent_user_id === user?.id
        });
        
        // If session is expired, only show if user is creator or opponent
        if (sessionExpired) {
          return match.creator_user_id === user?.id || match.opponent_user_id === user?.id;
        }
        
        return true;
      }) || [];
      
      console.log('Filtered matches:', filteredMatches);
      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load practice sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchAttendedSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('practice_matches')
        .select(`
          *,
          creator_profile:profiles!practice_matches_creator_user_id_fkey (
            display_name,
            username,
            avatar_url,
            rating
          ),
          opponent_profile:profiles!practice_matches_opponent_user_id_fkey (
            display_name,
            username,
            avatar_url,
            rating
          )
        `)
        .or(`creator_user_id.eq.${user.id},opponent_user_id.eq.${user.id}`)
        .in('status', ['completed', 'active'])
        .order('end_time', { ascending: false });

      if (error) throw error;
      
      // Filter to include completed sessions and expired active sessions (2+ hours after start)
      const attendedSessions = (data as any)?.filter((session: PracticeMatch) => {
        if (session.status === 'completed') return true;
        
        // Check if active session has expired (2+ hours after start)
        if (session.status === 'active' && session.start_time) {
          const startTime = new Date(session.start_time);
          const now = new Date();
          const sessionExpired = now.getTime() - startTime.getTime() > 2 * 60 * 60 * 1000; // 2 hours
          return sessionExpired;
        }
        
        return false;
      }) || [];
      
      setAttendedSessions(attendedSessions);
    } catch (error) {
      console.error('Error fetching attended sessions:', error);
    }
  };

  const createSession = async () => {
    if (!user || !newSession.topic_title || !newSession.difficulty || !newSession.start_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including start time",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 CREATING SESSION WITH DATA:', {
      topic_title: newSession.topic_title,
      difficulty: newSession.difficulty,
      start_time: newSession.start_time,
      userLocalTime: new Date(newSession.start_time),
      currentTime: new Date()
    });
    console.warn('📝 Creating session - check this log!');

    // Parse user input as Eastern Time and compare with current Eastern Time
    const easternTimeZone = 'America/New_York';
    const currentUTC = new Date();
    
    // Parse user's input as Eastern Time (treat the input as if it's already in Eastern timezone)
    const userInputAsEasternTime = new Date(newSession.start_time + ':00'); // Add seconds if missing
    const startTimeInUTC = fromZonedTime(userInputAsEasternTime, easternTimeZone);
    
    console.log('🔍 FIXED TIMEZONE DEBUG:');
    console.log('1. User input:', newSession.start_time);
    console.log('2. Current UTC:', currentUTC.toISOString());
    console.log('3. Current Eastern formatted:', formatInTimeZone(currentUTC, easternTimeZone, 'yyyy-MM-dd HH:mm:ss zzz'));
    console.log('4. User input treated as Eastern:', userInputAsEasternTime.toISOString());
    console.log('5. User Eastern time converted to UTC:', startTimeInUTC.toISOString());
    
    const timeDiff = startTimeInUTC.getTime() - currentUTC.getTime();
    const timeDiffMinutes = timeDiff / (1000 * 60);
    
    console.log('6. Time difference (minutes):', timeDiffMinutes);
    
    if (timeDiff < -5 * 60 * 1000) { // More than 5 minutes in the past
      toast({
        title: "Warning", 
        description: `Start time cannot be more than 5 minutes in the past. Current Eastern Time: ${formatInTimeZone(currentUTC, easternTimeZone, 'HH:mm')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // If custom topic, save it to topics table first
      let topicId = newSession.topic_id;
      if (showCustomTopic && newSession.topic_title) {
        const { data: newTopic, error: topicError } = await supabase
          .from('topics')
          .insert({
            title: newSession.topic_title,
            description: `Custom topic created by user`,
            category: 'custom',
            difficulty: newSession.difficulty,
            is_custom: true,
            created_by_user_id: user.id
          })
          .select()
          .single();

        if (topicError) throw topicError;
        topicId = newTopic.id;
        
        // Refresh topics list
        fetchTopics();
      }

      const { error } = await supabase
        .from('practice_matches')
        .insert({
          creator_user_id: user.id,
          topic_id: topicId || null,
          topic_title: newSession.topic_title,
          difficulty: newSession.difficulty,
          start_time: newSession.start_time,
          status: 'waiting'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Practice session created! Waiting for opponents...",
      });

      setNewSession({
        topic_id: '',
        topic_title: '',
        difficulty: 'beginner',
        start_time: '',
        description: ''
      });
      setShowCustomTopic(false);

      fetchMatches();
      setActiveTab('find');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create practice session",
        variant: "destructive",
      });
    }
  };

  const joinSession = async (sessionId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to join sessions",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_matches')
        .update({
          opponent_user_id: user.id,
          status: 'active',
          start_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setJoinedSessionId(sessionId);
      toast({
        title: "Success",
        description: "Joined practice session!",
      });
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Error",
        description: "Failed to join session",
        variant: "destructive",
      });
    }
  };

  const getTimeUntilStart = (startTime?: string): string => {
    if (!startTime) return 'Starting now';
    
    const start = new Date(startTime);
    const now = currentTime;
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Starting now';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const canJoinSession = (startTime?: string): boolean => {
    if (!startTime) return true;
    
    const start = new Date(startTime);
    const now = currentTime;
    const diff = start.getTime() - now.getTime();
    const diffMinutes = diff / (1000 * 60);
    
    // Can join if session starts within 15 minutes in the past to 1 hour in the future
    return diffMinutes >= -15 && diffMinutes <= 60;
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (joinedSessionId) {
    return (
      <JoinSession 
        sessionId={joinedSessionId}
        onBack={() => setJoinedSessionId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-pulse">Loading practice arena...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Global Practice Arena
        </h1>
        <p className="text-muted-foreground">
          Join live debates with debaters from around the world
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'find' | 'create' | 'attended')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="find">Find Sessions</TabsTrigger>
          <TabsTrigger value="create">Create Session</TabsTrigger>
          <TabsTrigger value="attended">Attended Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="space-y-4">
          {matches.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-border/30">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No active sessions. Be the first to create one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {matches.map((session) => (
                <Card key={session.id} className="bg-card/50 backdrop-blur-sm border-border/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.topic_title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(session.difficulty)}>
                          {session.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeUntilStart(session.start_time)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={session.creator_profile?.avatar_url} />
                          <AvatarFallback>
                            {session.creator_profile?.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.creator_profile?.display_name || session.creator_profile?.username}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="w-3 h-3" />
                            <span>{session.creator_profile?.rating || 1000}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => {
                          console.log('Join button clicked for session:', session.id);
                          console.log('Can join session:', canJoinSession(session.start_time));
                          console.log('Is creator:', session.creator_user_id === user?.id);
                          joinSession(session.id);
                        }}
                        disabled={!canJoinSession(session.start_time)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {session.creator_user_id === user?.id ? 'Start Session' : 'Join Session'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardHeader>
              <CardTitle>Create Practice Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic *</label>
                {!showCustomTopic ? (
                  <Select value={newSession.topic_id} onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomTopic(true);
                      setNewSession(prev => ({
                        ...prev,
                        topic_id: '',
                        topic_title: ''
                      }));
                    } else {
                      const topic = topics.find(t => t.id === value);
                      setNewSession(prev => ({
                        ...prev,
                        topic_id: value,
                        topic_title: topic?.title || ''
                      }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        ✏️ Create Custom Topic
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter your custom topic"
                      value={newSession.topic_title}
                      onChange={(e) => setNewSession(prev => ({ ...prev, topic_title: e.target.value }))}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowCustomTopic(false);
                        setNewSession(prev => ({ ...prev, topic_title: '', topic_id: '' }));
                      }}
                    >
                      Back to Topic Selection
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select value={newSession.difficulty} onValueChange={(value) => 
                  setNewSession(prev => ({ ...prev, difficulty: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">
                  All times are in Eastern Time (ET). Select when the debate should start.
                </p>
              </div>

              <Button onClick={() => {
                console.error('🚨 CREATE SESSION BUTTON CLICKED! 🚨');
                console.log('Form data check:', {
                  user: !!user,
                  topic_title: newSession.topic_title,
                  difficulty: newSession.difficulty,
                  start_time: newSession.start_time,
                  showCustomTopic
                });
                createSession();
              }} className="w-full">
                Create Session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attended" className="space-y-4">
          {attendedSessions.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-border/30">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No attended sessions yet. Join some debates to see them here!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {attendedSessions.map((session) => (
                <Card key={session.id} className="bg-card/50 backdrop-blur-sm border-border/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.topic_title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(session.difficulty)}>
                          {session.difficulty}
                        </Badge>
                        {session.winner_user_id === user?.id && (
                          <Badge className="bg-green-500/20 text-green-300">Won</Badge>
                        )}
                        {session.winner_user_id && session.winner_user_id !== user?.id && (
                          <Badge className="bg-red-500/20 text-red-300">Lost</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={session.creator_profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {session.creator_profile?.display_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {session.creator_user_id === user?.id ? 'You' : 
                             session.creator_profile?.display_name || session.creator_profile?.username}
                          </span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={session.opponent_profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {session.opponent_profile?.display_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {session.opponent_user_id === user?.id ? 'You' : 
                             session.opponent_profile?.display_name || session.opponent_profile?.username}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.end_time || session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play className="w-3 h-3" />
                        View Recording
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};