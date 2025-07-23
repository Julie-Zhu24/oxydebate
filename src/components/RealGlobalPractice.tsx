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
}

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

export const RealGlobalPractice = () => {
  const [activeTab, setActiveTab] = useState<'find' | 'create'>('find');
  const [matches, setMatches] = useState<PracticeMatch[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
  }, []);

  const fetchMatches = async () => {
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
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatches((data as any) || []);
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

  const createSession = async () => {
    if (!user || !newSession.topic_title || !newSession.difficulty) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_matches')
        .insert({
          creator_user_id: user.id,
          topic_id: newSession.topic_id || null,
          topic_title: newSession.topic_title,
          difficulty: newSession.difficulty,
          start_time: newSession.start_time || null,
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
    
    return diff <= 5 * 60 * 1000; // Can join 5 minutes before start
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'find' | 'create')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="find">Find Sessions</TabsTrigger>
          <TabsTrigger value="create">Create Session</TabsTrigger>
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
                        onClick={() => joinSession(session.id)}
                        disabled={!canJoinSession(session.start_time) || session.creator_user_id === user?.id}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Join Session
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
                <label className="text-sm font-medium">Topic</label>
                <Select value={newSession.topic_id} onValueChange={(value) => {
                  const topic = topics.find(t => t.id === value);
                  setNewSession(prev => ({
                    ...prev,
                    topic_id: value,
                    topic_title: topic?.title || prev.topic_title
                  }));
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Topic (optional)</label>
                <Input
                  placeholder="Or enter a custom topic"
                  value={newSession.topic_title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, topic_title: e.target.value }))}
                />
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
                <label className="text-sm font-medium">Start Time (optional)</label>
                <Input
                  type="datetime-local"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <Button onClick={createSession} className="w-full">
                Create Session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};