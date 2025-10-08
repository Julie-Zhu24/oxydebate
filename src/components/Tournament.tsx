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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentLeaderboard } from '@/components/TournamentLeaderboard';
import { TournamentAdmin } from '@/components/TournamentAdmin';
import { TournamentAnnouncements } from '@/components/TournamentAnnouncements';
import { RegistrationModal } from '@/components/RegistrationModal';
import { SafeHTML } from '@/components/SafeHTML';
import { Users, Gavel, LogIn } from 'lucide-react';
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
  
  // Portal state
  const [portalEmail, setPortalEmail] = useState('');
  const [isInPortal, setIsInPortal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Modal states
  const [isDebaterModalOpen, setIsDebaterModalOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);

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

  const handleDebaterSubmit = async (formData) => {
    try {
      const { error } = await supabase.from('tournament_debaters').insert([{
        ...formData,
        user_id: user?.id,
        privacy_accepted: true
      }]);
      
      if (error) throw error;
      
      toast.success('Registration submitted successfully!');
      fetchDebaters();
    } catch (error) {
      toast.error('Registration failed: ' + error.message);
    }
  };

  const handleJudgeSubmit = async (formData) => {
    try {
      const { error } = await supabase.from('tournament_judges').insert([{
        ...formData,
        user_id: user?.id,
        privacy_accepted: true
      }]);
      
      if (error) throw error;
      
      toast.success('Judge application submitted successfully!');
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
      // First, get the team name to delete related records
      const { data: debater, error: fetchError } = await supabase
        .from('tournament_debaters')
        .select('team_name')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete all speaker scores for this team
      const { error: scoresError } = await supabase
        .from('tournament_speaker_scores')
        .delete()
        .eq('team_name', debater.team_name);
      
      if (scoresError) throw scoresError;
      
      // Delete the team/debater record
      const { error: deleteError } = await supabase
        .from('tournament_debaters')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast.success('Team and all related records deleted successfully!');
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
    if (!portalEmail) {
      toast.error('Please enter your email to check in');
      return;
    }

    const activeSession = checkInSessions.find(session => session.is_active);
    if (!activeSession) {
      toast.error('No active check-in session');
      return;
    }

    // Check if user has already checked in for this active session
    const existingCheckIn = checkIns.find(
      checkIn => checkIn.session_id === activeSession.id && 
                 checkIn.participant_email === portalEmail
    );

    if (existingCheckIn) {
      toast.success('You are already checked in for this session!');
      return;
    }

    try {
      const { error } = await supabase.from('check_ins').insert([{
        session_id: activeSession.id,
        participant_email: portalEmail,
        participant_name: portalEmail,
        participant_type: 'debater'
      }]);
      
      if (error) throw error;
      
      toast.success('Checked in successfully!');
      fetchCheckIns();
    } catch (error) {
      toast.error('Check-in failed: ' + error.message);
    }
  };

  const handlePortalAccess = async (e) => {
    e.preventDefault();
    if (!portalEmail) {
      toast.error('Please enter your email');
      return;
    }

    setIsVerifying(true);
    try {
      // Check if email exists in debaters or judges
      const isRegistered = allRegisteredEmails.includes(portalEmail.toLowerCase());
      
      if (isRegistered) {
        setIsInPortal(true);
        toast.success('Welcome to the tournament portal!');
      } else {
        toast.error('Email not found. Please make sure you are registered for the tournament.');
      }
    } catch (error) {
      toast.error('Failed to verify email');
    } finally {
      setIsVerifying(false);
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

  // Admin view - full functionality
  if (isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tournament Administration</h1>
        
        {/* Admin Panel */}
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

            {/* Tournament Announcements */}
            <TournamentAnnouncements />

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
          </CardContent>
        </Card>

        {/* Tournament Leaderboard */}
        <TournamentLeaderboard />

        <Separator className="my-8" />

        {/* Admin Tournament Management */}
        <TournamentAdmin />
      </div>
    );
  }

  // Portal view - for registered participants
  if (isInPortal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tournament Portal</h1>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsInPortal(false);
              setPortalEmail('');
            }}
          >
            Exit Portal
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-6">Welcome, {portalEmail}</p>

        {/* Check In Section */}
        {activeSession && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Check In</CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns.find(checkIn => checkIn.session_id === activeSession.id && checkIn.participant_email === portalEmail) ? (
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">✓ You are checked in for this session</p>
                  <p className="text-sm text-muted-foreground">No need to check in again until the next session begins</p>
                </div>
              ) : (
                <Button onClick={handleCheckIn} className="w-full">
                  Check In for Tournament
                </Button>
              )}
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
                      <SafeHTML 
                        content={announcement.content} 
                        className="text-muted-foreground mt-1"
                      />
                     
                     {/* File Attachments */}
                     {announcement.file_attachments && Array.isArray(announcement.file_attachments) && announcement.file_attachments.length > 0 && (
                       <div className="mt-3 space-y-2">
                         <p className="text-sm font-medium">Attachments:</p>
                         <div className="space-y-1">
                           {announcement.file_attachments.map((file: any, index: number) => (
                             <div key={index}>
                               {file.type?.startsWith('image/') ? (
                                 <img
                                   src={file.url}
                                   alt={file.name}
                                   className="max-w-full h-auto rounded border max-h-64 object-contain"
                                 />
                               ) : (
                                 <a
                                   href={file.url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                                 >
                                   <span>📄</span>
                                   {file.name}
                                 </a>
                               )}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     <small className="text-xs text-muted-foreground block mt-2">
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

        {/* Leaderboard */}
        <TournamentLeaderboard />
      </div>
    );
  }

  // Public view - registration and portal entrance only
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Shanghai Debate Pentaleague</h1>
        <p className="text-lg text-muted-foreground">Join us for an exciting debate tournament • December 6th to 7th</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Portal Entrance */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Portal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Already registered? Enter your email to access announcements, leaderboards, and check-in
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePortalAccess} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your registered email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value.toLowerCase())}
                required
              />
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Enter Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Registration Section - Only show if registration is open */}
        {tournamentSettings?.registration_open && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Debater Registration Button */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setIsDebaterModalOpen(true)}>
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Register as Debater</h3>
                <p className="text-muted-foreground mb-6">
                  Join the tournament as a debating team. Compete with your partner for victory and glory.
                </p>
                <Button size="lg" className="w-full">
                  Start Registration
                </Button>
              </CardContent>
            </Card>

            {/* Judge Application Button */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setIsJudgeModalOpen(true)}>
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Gavel className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Apply as Judge</h3>
                <p className="text-muted-foreground mb-6">
                  Help evaluate debates and ensure fair competition. Share your expertise with the community.
                </p>
                <Button size="lg" variant="secondary" className="w-full">
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Registration Closed Message */}
        {!tournamentSettings?.registration_open && (
          <Card>
            <CardHeader>
              <CardTitle>Tournament Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tournament registration is currently closed. Please check back later for future tournaments.</p>
            </CardContent>
          </Card>
        )}

        {/* Registration Modals */}
        <RegistrationModal
          isOpen={isDebaterModalOpen}
          onClose={() => setIsDebaterModalOpen(false)}
          type="debater"
          onSubmit={handleDebaterSubmit}
        />
        
        <RegistrationModal
          isOpen={isJudgeModalOpen}
          onClose={() => setIsJudgeModalOpen(false)}
          type="judge"
          onSubmit={handleJudgeSubmit}
        />
      </div>
    </div>
  );
};

export default Tournament;
