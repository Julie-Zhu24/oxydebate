import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const Tournament = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentLocation, setTournamentLocation] = useState('');
  const [tournamentStartDate, setTournamentStartDate] = useState('');
  const [tournamentEndDate, setTournamentEndDate] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [debaters, setDebaters] = useState([]);
  const [judges, setJudges] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [checkInSessions, setCheckInSessions] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [tournamentSettings, setTournamentSettings] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  
  // Form states
  const [debaterForm, setDebaterForm] = useState({
    name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: ''
  });
  const [judgeForm, setJudgeForm] = useState({
    name: '', email: '', debate_experience: '', judge_experience: ''
  });

  useEffect(() => {
    fetchDebaters();
    fetchJudges();
    fetchAnnouncements();
    fetchCheckInSessions();
    fetchCheckIns();
    fetchTournamentSettings();
  }, []);

  const fetchDebaters = async () => {
    const { data } = await supabase.from('tournament_debaters').select('*');
    setDebaters(data || []);
  };

  const fetchJudges = async () => {
    const { data } = await supabase.from('tournament_judges').select('*');
    setJudges(data || []);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('tournament_announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  const fetchCheckInSessions = async () => {
    const { data } = await supabase.from('check_in_sessions').select('*').order('created_at', { ascending: false });
    setCheckInSessions(data || []);
  };

  const fetchCheckIns = async () => {
    const { data } = await supabase.from('check_ins').select('*');
    setCheckIns(data || []);
  };

  const fetchTournamentSettings = async () => {
    const { data } = await supabase.from('tournament_settings').select('*').limit(1).single();
    setTournamentSettings(data);
  };

  const handleDebaterSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tournament_debaters').insert([{
        ...debaterForm,
        user_id: user?.id,
        privacy_accepted: true
      }]);
      
      if (error) throw error;
      
      toast.success('Registration submitted successfully!');
      setDebaterForm({ name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: '' });
      fetchDebaters();
    } catch (error) {
      toast.error('Registration failed: ' + error.message);
    }
  };

  const handleJudgeSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tournament_judges').insert([{
        ...judgeForm,
        user_id: user?.id,
        privacy_accepted: true
      }]);
      
      if (error) throw error;
      
      toast.success('Judge application submitted successfully!');
      setJudgeForm({ name: '', email: '', debate_experience: '', judge_experience: '' });
      fetchJudges();
    } catch (error) {
      toast.error('Application failed: ' + error.message);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.from('tournament_announcements').insert([{
        ...newAnnouncement,
        created_by_user_id: user.id,
        target_type: 'all'
      }]);
      
      if (error) throw error;
      
      toast.success('Announcement created successfully!');
      setNewAnnouncement({ title: '', content: '' });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement: ' + error.message);
    }
  };

  const deleteDebater = async (id) => {
    try {
      const { error } = await supabase.from('tournament_debaters').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Team deleted successfully!');
      fetchDebaters(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete team: ' + error.message);
    }
  };

  const deleteJudge = async (id) => {
    try {
      const { error } = await supabase.from('tournament_judges').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Judge deleted successfully!');
      fetchJudges(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete judge: ' + error.message);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const { error } = await supabase.from('tournament_announcements').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Announcement deleted successfully!');
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete announcement: ' + error.message);
    }
  };

  const startCheckInSession = async () => {
    if (!user?.id) return;
    
    try {
      // End any active sessions first
      await supabase.from('check_in_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('is_active', true);
      
      const { error } = await supabase.from('check_in_sessions').insert([{
        created_by_user_id: user.id,
        is_active: true
      }]);
      
      if (error) throw error;
      
      toast.success('Check-in session started!');
      fetchCheckInSessions();
    } catch (error) {
      toast.error('Failed to start check-in session: ' + error.message);
    }
  };

  const endCheckInSession = async () => {
    try {
      const { error } = await supabase.from('check_in_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('is_active', true);
      
      if (error) throw error;
      
      toast.success('Check-in session ended!');
      fetchCheckInSessions();
    } catch (error) {
      toast.error('Failed to end check-in session: ' + error.message);
    }
  };

  const handleCheckIn = async () => {
    if (!user?.email) {
      toast.error('Please log in to check in');
      return;
    }

    const activeSession = checkInSessions.find(session => session.is_active);
    if (!activeSession) {
      toast.error('No active check-in session');
      return;
    }

    // Check if user has already checked in for this session
    const existingCheckIn = checkIns.find(
      checkIn => checkIn.session_id === activeSession.id && 
                 checkIn.participant_email === user.email
    );

    if (existingCheckIn) {
      toast.error('You have already checked in for this session');
      return;
    }

    try {
      const { error } = await supabase.from('check_ins').insert([{
        session_id: activeSession.id,
        participant_email: user.email,
        participant_name: user.email, // You might want to get actual name from profile
        participant_type: 'debater' // You might want to determine this based on registration
      }]);
      
      if (error) throw error;
      
      toast.success('Checked in successfully!');
      fetchCheckIns();
    } catch (error) {
      toast.error('Check-in failed: ' + error.message);
    }
  };

  const activeSession = checkInSessions.find(session => session.is_active);
  const currentSessionCheckIns = activeSession 
    ? checkIns.filter(checkIn => checkIn.session_id === activeSession.id)
    : [];

  const allRegisteredEmails = [
    ...debaters.map(d => d.email),
    ...debaters.map(d => d.partner_email),
    ...judges.map(j => j.email)
  ].filter(Boolean);

  const checkedInEmails = currentSessionCheckIns.map(c => c.participant_email);
  const notCheckedInEmails = allRegisteredEmails.filter(email => !checkedInEmails.includes(email));

  if (!tournamentSettings?.registration_open && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Registration Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Tournament registration is currently closed. Please check back later.</p>
            
            {user && activeSession && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Check In</h3>
                <Button onClick={handleCheckIn} className="w-full">
                  Check In for Tournament
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tournament</h1>
      
      {/* Admin Panel */}
      {isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Check-in Management */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Check-in Management</h3>
              <div className="flex gap-2 mb-4">
                <Button onClick={startCheckInSession} disabled={!!activeSession}>
                  Start Check-in Session
                </Button>
                <Button onClick={endCheckInSession} disabled={!activeSession} variant="outline">
                  End Check-in Session
                </Button>
              </div>
              
              {activeSession && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Present ({checkedInEmails.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {currentSessionCheckIns.map(checkIn => (
                        <Badge key={checkIn.id} variant="secondary" className="block w-fit">
                          {checkIn.participant_email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Missing ({notCheckedInEmails.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {notCheckedInEmails.map(email => (
                        <Badge key={email} variant="outline" className="block w-fit">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Create Announcement */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Create Announcement</h3>
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <Input
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Announcement content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  required
                />
                <Button type="submit">Create Announcement</Button>
              </form>
            </div>

            <Separator />

            {/* Registered Teams */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Registered Teams ({debaters.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {debaters.map(debater => (
                  <div key={debater.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <strong>{debater.team_name}</strong> - {debater.name} & {debater.partner_name}
                      <br />
                      <small className="text-muted-foreground">{debater.school}</small>
                    </div>
                    <Button 
                      onClick={() => deleteDebater(debater.id)} 
                      variant="destructive" 
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Judge Applications */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Judge Applications ({judges.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {judges.map(judge => (
                  <div key={judge.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <strong>{judge.name}</strong> - {judge.email}
                      <br />
                      <small className="text-muted-foreground">
                        Status: {judge.status} | Experience: {judge.judge_experience}
                      </small>
                    </div>
                    <Button 
                      onClick={() => deleteJudge(judge.id)} 
                      variant="destructive" 
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Announcements Management */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Manage Announcements</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <strong>{announcement.title}</strong>
                      <br />
                      <small className="text-muted-foreground">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <Button 
                      onClick={() => deleteAnnouncement(announcement.id)} 
                      variant="destructive" 
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check In Section for Participants */}
      {user && activeSession && !isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Check In</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCheckIn} className="w-full">
              Check In for Tournament
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div key={announcement.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <p className="text-muted-foreground mt-1">{announcement.content}</p>
                  <small className="text-xs text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No announcements yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Registration Forms */}
      {tournamentSettings?.registration_open && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Debater Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Register as Debater</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDebaterSubmit} className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={debaterForm.name}
                  onChange={(e) => setDebaterForm({...debaterForm, name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={debaterForm.email}
                  onChange={(e) => setDebaterForm({...debaterForm, email: e.target.value})}
                  required
                />
                <Input
                  placeholder="School"
                  value={debaterForm.school}
                  onChange={(e) => setDebaterForm({...debaterForm, school: e.target.value})}
                  required
                />
                <Input
                  placeholder="Partner's name"
                  value={debaterForm.partner_name}
                  onChange={(e) => setDebaterForm({...debaterForm, partner_name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  placeholder="Partner's email"
                  value={debaterForm.partner_email}
                  onChange={(e) => setDebaterForm({...debaterForm, partner_email: e.target.value})}
                  required
                />
                <Input
                  placeholder="Team name"
                  value={debaterForm.team_name}
                  onChange={(e) => setDebaterForm({...debaterForm, team_name: e.target.value})}
                  required
                />
                <Button type="submit" className="w-full">Register Team</Button>
              </form>
            </CardContent>
          </Card>

          {/* Judge Application */}
          <Card>
            <CardHeader>
              <CardTitle>Apply as Judge</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJudgeSubmit} className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={judgeForm.name}
                  onChange={(e) => setJudgeForm({...judgeForm, name: e.target.value})}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={judgeForm.email}
                  onChange={(e) => setJudgeForm({...judgeForm, email: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Your debate experience"
                  value={judgeForm.debate_experience}
                  onChange={(e) => setJudgeForm({...judgeForm, debate_experience: e.target.value})}
                  required
                />
                <Textarea
                  placeholder="Your judging experience"
                  value={judgeForm.judge_experience}
                  onChange={(e) => setJudgeForm({...judgeForm, judge_experience: e.target.value})}
                  required
                />
                <Button type="submit" className="w-full">Submit Application</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Tournament;
