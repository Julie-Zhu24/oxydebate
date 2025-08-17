import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Gavel, LogIn, Plus, Send, Check, X, Trash2, Settings, UserPlus, ChevronDown, Clock, UserCheck } from 'lucide-react';

interface Debater {
  id: string;
  name: string;
  email: string;
  school: string;
  partner_name: string;
  partner_email: string;
  team_name: string;
  created_at: string;
}

interface Judge {
  id: string;
  name: string;
  email: string;
  judge_experience: string;
  debate_experience: string;
  status: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: string;
  target_team_name?: string;
  target_individual_email?: string;
  file_attachments?: Array<{name: string, url: string, type: string}>;
  created_at: string;
}

interface CheckInSession {
  id: string;
  is_active: boolean;
  started_at: string;
  ended_at?: string;
  created_by_user_id: string;
}

interface CheckIn {
  id: string;
  session_id: string;
  participant_email: string;
  participant_name: string;
  participant_type: string;
  checked_in_at: string;
}

export const Tournament = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const { toast } = useToast();

  const [debaters, setDebaters] = useState<Debater[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [portalEmail, setPortalEmail] = useState('');
  const [portalData, setPortalData] = useState<any>(null);
  const [showPortal, setShowPortal] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [judgeToDelete, setJudgeToDelete] = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [checkInSession, setCheckInSession] = useState<CheckInSession | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // New team form
  const [newTeamForm, setNewTeamForm] = useState({
    name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: ''
  });

  // Registration forms state
  const [debaterForm, setDebaterForm] = useState({
    name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: '', privacy_accepted: false
  });
  const [judgeForm, setJudgeForm] = useState({
    name: '', email: '', judge_experience: '', debate_experience: '', privacy_accepted: false
  });

  // Admin announcement form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_type: 'all',
    target_team_name: '',
    target_individual_email: '',
    file_attachments: [] as Array<{name: string, url: string, type: string}>
  });

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
      loadRegistrationSettings();
    }
    loadAnnouncements();
    loadCheckInData();
    if (!isAdmin) {
      loadRegistrationSettings();
    }
  }, [isAdmin]);

  const loadCheckInData = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('check_in_sessions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (sessionError) throw sessionError;
      setCheckInSession(sessionData);

      if (sessionData) {
        const { data: checkInsData, error: checkInsError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('session_id', sessionData.id);

        if (checkInsError) throw checkInsError;
        setCheckIns(checkInsData || []);

        // Check if current user has already checked in
        if (portalEmail) {
          const userCheckIn = checkInsData?.find(c => c.participant_email === portalEmail);
          setHasCheckedIn(!!userCheckIn);
        }
      }
    } catch (error: any) {
      console.error('Failed to load check-in data:', error);
    }
  };

  const loadRegistrationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_settings')
        .select('registration_open')
        .maybeSingle();
      
      if (error) throw error;
      setRegistrationOpen(data?.registration_open ?? true);
    } catch (error: any) {
      console.error('Failed to load registration settings:', error);
    }
  };

  const toggleRegistration = async () => {
    try {
      const { data: currentSettings } = await supabase
        .from('tournament_settings')
        .select('*')
        .maybeSingle();

      if (currentSettings) {
        const { error } = await supabase
          .from('tournament_settings')
          .update({ registration_open: !registrationOpen })
          .eq('id', currentSettings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tournament_settings')
          .insert([{ registration_open: !registrationOpen }]);
        
        if (error) throw error;
      }

      setRegistrationOpen(!registrationOpen);
      toast({ 
        title: registrationOpen ? 'Registration Closed' : 'Registration Reopened',
        description: registrationOpen ? 'New registrations are now disabled.' : 'New registrations are now enabled.'
      });
    } catch (error: any) {
      toast({ title: 'Failed to update registration', description: error.message, variant: 'destructive' });
    }
  };

  const createNewTeam = async () => {
    try {
      const { error } = await supabase.from('tournament_debaters').insert([{
        ...newTeamForm,
        user_id: user?.id
      }]);

      if (error) throw error;

      toast({ title: 'Team created successfully!' });
      setNewTeamForm({ name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: '' });
      loadAdminData();
    } catch (error: any) {
      toast({ title: 'Failed to create team', description: error.message, variant: 'destructive' });
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_debaters')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({ title: 'Team deleted successfully' });
      loadAdminData();
    } catch (error: any) {
      toast({ title: 'Failed to delete team', description: error.message, variant: 'destructive' });
    }
  };

  const deleteJudge = async (judgeId: string) => {
    try {
      const { error } = await supabase
        .from('tournament_judges')
        .delete()
        .eq('id', judgeId);

      if (error) throw error;

      toast({ title: 'Judge application deleted successfully' });
      loadAdminData();
      setJudgeToDelete(null);
    } catch (error: any) {
      toast({ title: 'Failed to delete judge', description: error.message, variant: 'destructive' });
    }
  };

  const loadAdminData = async () => {
    try {
      const [debatersRes, judgesRes] = await Promise.all([
        supabase.from('tournament_debaters').select('*').order('team_name', { ascending: true }),
        supabase.from('tournament_judges').select('*').order('created_at', { ascending: false })
      ]);

      if (debatersRes.error) throw debatersRes.error;
      if (judgesRes.error) throw judgesRes.error;

      // Group debaters by team for better organization
      const sortedDebaters = (debatersRes.data || []).sort((a, b) => {
        if (a.team_name === b.team_name) {
          return a.created_at.localeCompare(b.created_at);
        }
        return a.team_name.localeCompare(b.team_name);
      });

      setDebaters(sortedDebaters);
      setJudges(judgesRes.data || []);
    } catch (error: any) {
      toast({ title: 'Failed to load data', description: error.message, variant: 'destructive' });
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data || []).map(item => ({
        ...item,
        file_attachments: Array.isArray(item.file_attachments) 
          ? item.file_attachments as Array<{name: string, url: string, type: string}>
          : []
      })));
    } catch (error: any) {
      toast({ title: 'Failed to load announcements', description: error.message, variant: 'destructive' });
    }
  };

  const handleDebaterRegistration = async () => {
    if (!debaterForm.privacy_accepted) {
      toast({ title: 'Please accept the privacy agreement', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('tournament_debaters').insert([{
        ...debaterForm,
        user_id: user?.id
      }]);

      if (error) throw error;

      toast({ title: 'Registration successful!', description: 'Your debater registration has been submitted.' });
      setDebaterForm({ name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: '', privacy_accepted: false });
    } catch (error: any) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleJudgeApplication = async () => {
    if (!judgeForm.privacy_accepted) {
      toast({ title: 'Please accept the privacy agreement', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('tournament_judges').insert([{
        ...judgeForm,
        user_id: user?.id
      }]);

      if (error) throw error;

      toast({ title: 'Application submitted!', description: 'Your judge application has been submitted. Please wait for email confirmation.' });
      setJudgeForm({ name: '', email: '', judge_experience: '', debate_experience: '', privacy_accepted: false });
    } catch (error: any) {
      toast({ title: 'Application failed', description: error.message, variant: 'destructive' });
    }
  };

  const handlePortalAccess = async () => {
    if (!portalEmail.trim()) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return;
    }

    try {
      // Check if email exists in debaters (including partner emails) or judges
      const [debaterRes, partnerRes, judgeRes] = await Promise.all([
        supabase.from('tournament_debaters').select('*').eq('email', portalEmail).maybeSingle(),
        supabase.from('tournament_debaters').select('*').eq('partner_email', portalEmail).maybeSingle(),
        supabase.from('tournament_judges').select('*').eq('email', portalEmail).maybeSingle()
      ]);

      const debaterData = debaterRes.data;
      const partnerData = partnerRes.data;
      const judgeData = judgeRes.data;

      if (debaterData) {
        const teamAnnouncements = announcements.filter(a => 
          a.target_type === 'all' || 
          a.target_type === 'debaters' || 
          (a.target_type === 'team' && a.target_team_name === debaterData.team_name) ||
          (a.target_type === 'individual' && a.target_individual_email === portalEmail)
        );
        setPortalData({ type: 'debater', data: debaterData, announcements: teamAnnouncements });
        setShowPortal(true);
      } else if (partnerData) {
        // Partner can access the portal using their team's registration
        const teamAnnouncements = announcements.filter(a => 
          a.target_type === 'all' || 
          a.target_type === 'debaters' || 
          (a.target_type === 'team' && a.target_team_name === partnerData.team_name) ||
          (a.target_type === 'individual' && a.target_individual_email === portalEmail)
        );
        setPortalData({ type: 'debater', data: partnerData, announcements: teamAnnouncements, isPartner: true });
        setShowPortal(true);
      } else if (judgeData) {
        if (judgeData.status === 'approved') {
          const judgeAnnouncements = announcements.filter(a => 
            a.target_type === 'all' || a.target_type === 'judges'
          );
          setPortalData({ type: 'judge', data: judgeData, announcements: judgeAnnouncements });
          setShowPortal(true);
        } else {
          toast({ 
            title: 'Application Pending', 
            description: 'Your judge application is still being reviewed. Please wait for email confirmation.',
            variant: 'destructive' 
          });
        }
      } else {
        toast({ 
          title: 'Email not found', 
          description: 'No registration found with this email address.',
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      toast({ title: 'Portal access failed', description: error.message, variant: 'destructive' });
    }
  };

  const updateJudgeStatus = async (judgeId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('tournament_judges')
        .update({ status })
        .eq('id', judgeId);

      if (error) throw error;

      toast({ title: `Judge ${status}`, description: `Judge application has been ${status}.` });
      loadAdminData();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  const createAnnouncement = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('tournament_announcements').insert([{
        ...announcementForm,
        created_by_user_id: user.id
      }]);

      if (error) throw error;

      toast({ title: 'Announcement created!', description: 'Your announcement has been posted.' });
      setAnnouncementForm({
        title: '',
        content: '',
        target_type: 'all',
        target_team_name: '',
        target_individual_email: '',
        file_attachments: []
      });
      loadAnnouncements();
    } catch (error: any) {
      toast({ title: 'Failed to create announcement', description: error.message, variant: 'destructive' });
    }
  };

  const getTeamNames = () => {
    return [...new Set(debaters.map(d => d.team_name))];
  };

  const getAllDebaterEmails = () => {
    const emails = new Set<string>();
    debaters.forEach(d => {
      emails.add(d.email);
      emails.add(d.partner_email);
    });
    return Array.from(emails).sort();
  };

  const getDebatersByEmail = () => {
    const debaterMap = new Map<string, string>();
    debaters.forEach(d => {
      debaterMap.set(d.email, d.name);
      debaterMap.set(d.partner_email, d.partner_name);
    });
    return debaterMap;
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `tournament-files/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('announcements').getPublicUrl(filePath);
      
      const attachment = {
        name: file.name,
        url: data.publicUrl,
        type: file.type
      };
      
      setAnnouncementForm(prev => ({
        ...prev,
        file_attachments: [...prev.file_attachments, attachment]
      }));
      
      toast({ title: 'File uploaded successfully!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    }
  };

  const startCheckIn = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('check_in_sessions').insert([{
        created_by_user_id: user.id,
        is_active: true
      }]);

      if (error) throw error;

      toast({ title: 'Check-in started!', description: 'Participants can now check in.' });
      loadCheckInData();
    } catch (error: any) {
      toast({ title: 'Failed to start check-in', description: error.message, variant: 'destructive' });
    }
  };

  const endCheckIn = async () => {
    if (!checkInSession) return;

    try {
      const { error } = await supabase
        .from('check_in_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', checkInSession.id);

      if (error) throw error;

      toast({ title: 'Check-in ended!', description: 'No more participants can check in.' });
      loadCheckInData();
    } catch (error: any) {
      toast({ title: 'Failed to end check-in', description: error.message, variant: 'destructive' });
    }
  };

  const participantCheckIn = async () => {
    if (!checkInSession || !portalData || hasCheckedIn) return;

    try {
      const participantName = portalData.type === 'debater' 
        ? (portalData.isPartner ? portalData.data.partner_name : portalData.data.name)
        : portalData.data.name;

      const { error } = await supabase.from('check_ins').insert([{
        session_id: checkInSession.id,
        participant_email: portalEmail,
        participant_name: participantName,
        participant_type: portalData.type
      }]);

      if (error) throw error;

      toast({ title: 'Checked in successfully!', description: 'You have been marked as present.' });
      setHasCheckedIn(true);
      loadCheckInData();
    } catch (error: any) {
      toast({ title: 'Check-in failed', description: error.message, variant: 'destructive' });
    }
  };

  const removeAttachment = (index: number) => {
    setAnnouncementForm(prev => ({
      ...prev,
      file_attachments: prev.file_attachments.filter((_, i) => i !== index)
    }));
  };

  const PrivacyContract = () => (
    <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
      <h4 className="font-semibold mb-2">Privacy Agreement</h4>
      <p>By participating in the 2025 Shanghai High School Debate Friend League:</p>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>You understand that meetings and debates may be recorded</li>
        <li>Your face and voice may be captured during recordings</li>
        <li>Your name and email will be accessed by tournament organizers</li>
        <li>You consent to these terms for tournament participation</li>
      </ul>
    </div>
  );

  if (showPortal && portalData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tournament Portal</h1>
          <Button variant="outline" onClick={() => setShowPortal(false)}>Back</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {portalData.type === 'debater' ? `Team: ${portalData.data.team_name}` : 'Judge Portal'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {portalData.type === 'debater' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Debater 1</Label>
                  <p>{portalData.data.name} ({portalData.data.email})</p>
                  <p className="text-sm text-muted-foreground">{portalData.data.school}</p>
                </div>
                <div>
                  <Label>Debater 2</Label>
                  <p>{portalData.data.partner_name} ({portalData.data.partner_email})</p>
                </div>
              </div>
            )}

            {/* Check-in Section */}
            {checkInSession && checkInSession.is_active && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Check-in Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Please check in to confirm your presence.</p>
                  <Button 
                    onClick={participantCheckIn}
                    disabled={hasCheckedIn}
                    className="w-full"
                  >
                    {hasCheckedIn ? (
                      <><Check className="mr-2 h-4 w-4" /> Checked In</>
                    ) : (
                      <><UserCheck className="mr-2 h-4 w-4" /> Check In</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">Announcements</h3>
              <div className="space-y-3">
                {portalData.announcements.map((announcement: Announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{announcement.title}</CardTitle>
                    </CardHeader>
                     <CardContent>
                       <p className="whitespace-pre-wrap">{announcement.content}</p>
                       {announcement.file_attachments && announcement.file_attachments.length > 0 && (
                         <div className="mt-3 space-y-2">
                           <h4 className="text-sm font-medium">Attachments:</h4>
                           {announcement.file_attachments.map((file, index) => (
                             <a
                               key={index}
                               href={file.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="block text-sm text-primary hover:underline"
                             >
                               📎 {file.name}
                             </a>
                           ))}
                         </div>
                       )}
                       <p className="text-xs text-muted-foreground mt-2">
                         {new Date(announcement.created_at).toLocaleDateString()}
                       </p>
                     </CardContent>
                  </Card>
                ))}
                {portalData.announcements.length === 0 && (
                  <p className="text-muted-foreground">No announcements yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tournament Administration</h1>
          <div className="flex items-center gap-4">
            <Button
              variant={registrationOpen ? "destructive" : "default"}
              onClick={toggleRegistration}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {registrationOpen ? 'Close Registration' : 'Reopen Registration'}
            </Button>
            <Badge variant={registrationOpen ? "default" : "secondary"}>
              Registration {registrationOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="debaters" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="debaters">Debaters ({debaters.length})</TabsTrigger>
            <TabsTrigger value="judges">Judges ({judges.length})</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="send">Send Announcement</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="debaters" className="space-y-4">
            {/* Create New Team Section - Collapsible */}
            <Collapsible open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New Team
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${createTeamOpen ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Debater 1 Name</Label>
                    <Input
                      value={newTeamForm.name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="First debater's name"
                    />
                  </div>
                  <div>
                    <Label>Debater 1 Email</Label>
                    <Input
                      type="email"
                      value={newTeamForm.email}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="first@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>School</Label>
                  <Input
                    value={newTeamForm.school}
                    onChange={(e) => setNewTeamForm(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="School name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Debater 2 Name</Label>
                    <Input
                      value={newTeamForm.partner_name}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, partner_name: e.target.value }))}
                      placeholder="Second debater's name"
                    />
                  </div>
                  <div>
                    <Label>Debater 2 Email</Label>
                    <Input
                      type="email"
                      value={newTeamForm.partner_email}
                      onChange={(e) => setNewTeamForm(prev => ({ ...prev, partner_email: e.target.value }))}
                      placeholder="second@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label>Team Name</Label>
                  <Input
                    value={newTeamForm.team_name}
                    onChange={(e) => setNewTeamForm(prev => ({ ...prev, team_name: e.target.value }))}
                    placeholder="Choose a team name"
                  />
                </div>
                    <Button onClick={createNewTeam} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Teams List */}
            <div className="grid gap-4">
              {debaters.map((debater) => (
                <Card key={debater.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Team: {debater.team_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge>{debater.school}</Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Team</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>Are you sure you want to delete team "{debater.team_name}"?</p>
                              <p className="text-sm text-muted-foreground">
                                This action cannot be undone. This will permanently delete the team registration.
                              </p>
                              <div className="flex gap-2 justify-end">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => deleteTeam(debater.id)}
                                >
                                  Delete Team
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Debater 1</Label>
                        <p>{debater.name} ({debater.email})</p>
                      </div>
                      <div>
                        <Label>Debater 2</Label>
                        <p>{debater.partner_name} ({debater.partner_email})</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Registered: {new Date(debater.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="judges" className="space-y-4">
            <div className="grid gap-4">
              {judges.map((judge) => (
                <Card key={judge.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{judge.name}</span>
                      <Badge variant={judge.status === 'approved' ? 'default' : judge.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {judge.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Email:</strong> {judge.email}</p>
                      <p><strong>Judge Experience:</strong> {judge.judge_experience}</p>
                      <p><strong>Debate Experience:</strong> {judge.debate_experience}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied: {new Date(judge.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {judge.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateJudgeStatus(judge.id, 'approved')}>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => updateJudgeStatus(judge.id, 'rejected')}>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Judge Application</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to delete the judge application for "{judge.name}"?</p>
                            <p className="text-sm text-muted-foreground">
                              This will permanently remove their application and they will lose access to the portal.
                            </p>
                            <div className="flex gap-2 justify-end">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button 
                                variant="destructive" 
                                onClick={() => deleteJudge(judge.id)}
                              >
                                Delete Application
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <div className="grid gap-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{announcement.title}</span>
                       <Badge>
                         {announcement.target_type === 'team' ? `Team: ${announcement.target_team_name}` : 
                          announcement.target_type === 'individual' ? `Individual: ${announcement.target_individual_email}` :
                          announcement.target_type}
                       </Badge>
                    </CardTitle>
                  </CardHeader>
                   <CardContent>
                     <p className="whitespace-pre-wrap">{announcement.content}</p>
                     {announcement.file_attachments && announcement.file_attachments.length > 0 && (
                       <div className="mt-3 space-y-2">
                         <h4 className="text-sm font-medium">Attachments:</h4>
                         {announcement.file_attachments.map((file, index) => (
                           <a
                             key={index}
                             href={file.url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="block text-sm text-primary hover:underline"
                           >
                             📎 {file.name}
                           </a>
                         ))}
                       </div>
                     )}
                     <p className="text-xs text-muted-foreground mt-2">
                       {new Date(announcement.created_at).toLocaleDateString()}
                     </p>
                   </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content"
                    className="min-h-32"
                  />
                </div>

                {/* File Attachments */}
                <div>
                  <Label>File Attachments</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          Array.from(e.target.files).forEach(file => handleFileUpload(file));
                        }
                      }}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    {announcementForm.file_attachments.length > 0 && (
                      <div className="space-y-1">
                        {announcementForm.file_attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Target</Label>
                  <select
                    value={announcementForm.target_type}
                    onChange={(e) => setAnnouncementForm(prev => ({ 
                      ...prev, 
                      target_type: e.target.value, 
                      target_team_name: '', 
                      target_individual_email: '' 
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Participants</option>
                    <option value="debaters">All Debaters</option>
                    <option value="judges">All Judges</option>
                    <option value="team">Specific Team</option>
                    <option value="individual">Individual Debater</option>
                  </select>
                </div>

                {announcementForm.target_type === 'team' && (
                  <div>
                    <Label>Team Name</Label>
                    <select
                      value={announcementForm.target_team_name}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_team_name: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select a team</option>
                      {getTeamNames().map(teamName => (
                        <option key={teamName} value={teamName}>{teamName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {announcementForm.target_type === 'individual' && (
                  <div>
                    <Label>Individual Debater</Label>
                    <select
                      value={announcementForm.target_individual_email}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_individual_email: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select a debater</option>
                      {getAllDebaterEmails().map(email => {
                        const debaterName = getDebatersByEmail().get(email) || email;
                        return (
                          <option key={email} value={email}>
                            {debaterName} ({email})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <Button onClick={createAnnouncement} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Check-in Management</h2>
              <div className="flex gap-2">
                {checkInSession && checkInSession.is_active ? (
                  <Button onClick={endCheckIn} variant="destructive">
                    <Clock className="mr-2 h-4 w-4" />
                    End Check-in
                  </Button>
                ) : (
                  <Button onClick={startCheckIn}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Start Check-in
                  </Button>
                )}
              </div>
            </div>

            {checkInSession ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Check-in Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={checkInSession.is_active ? "default" : "secondary"}>
                          {checkInSession.is_active ? "Active" : "Ended"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Participants Checked In</p>
                        <p className="text-2xl font-bold">{checkIns.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {checkIns.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Checked-in Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {checkIns.map((checkIn) => (
                          <div key={checkIn.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{checkIn.participant_name}</p>
                              <p className="text-sm text-muted-foreground">{checkIn.participant_email}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{checkIn.participant_type}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active check-in session</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">2025 Shanghai High School Debate League</h1>
        <p className="text-lg text-muted-foreground">Join the premier high school debate tournament in Shanghai</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {registrationOpen ? (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <CardTitle>Sign up as Debater</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">Register your debate team for the tournament</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Debater Registration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Name</Label>
                      <Input
                        value={debaterForm.name}
                        onChange={(e) => setDebaterForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label>Your Email</Label>
                      <Input
                        type="email"
                        value={debaterForm.email}
                        onChange={(e) => setDebaterForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>School</Label>
                    <Input
                      value={debaterForm.school}
                      onChange={(e) => setDebaterForm(prev => ({ ...prev, school: e.target.value }))}
                      placeholder="Your school name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Partner's Name</Label>
                      <Input
                        value={debaterForm.partner_name}
                        onChange={(e) => setDebaterForm(prev => ({ ...prev, partner_name: e.target.value }))}
                        placeholder="Partner's full name"
                      />
                    </div>
                    <div>
                      <Label>Partner's Email</Label>
                      <Input
                        type="email"
                        value={debaterForm.partner_email}
                        onChange={(e) => setDebaterForm(prev => ({ ...prev, partner_email: e.target.value }))}
                        placeholder="partner.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Team Name</Label>
                    <Input
                      value={debaterForm.team_name}
                      onChange={(e) => setDebaterForm(prev => ({ ...prev, team_name: e.target.value }))}
                      placeholder="Choose a creative team name (doesn't have to be your school's name)"
                    />
                  </div>
                  
                  <PrivacyContract />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="debater-privacy"
                      checked={debaterForm.privacy_accepted}
                      onCheckedChange={(checked) => setDebaterForm(prev => ({ ...prev, privacy_accepted: !!checked }))}
                    />
                    <Label htmlFor="debater-privacy">I accept the privacy agreement</Label>
                  </div>
                  
                  <Button onClick={handleDebaterRegistration} className="w-full">
                    Register Team
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <Gavel className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <CardTitle>Apply to be Judge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">Apply to judge tournament debates</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Judge Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Name</Label>
                      <Input
                        value={judgeForm.name}
                        onChange={(e) => setJudgeForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label>Your Email</Label>
                      <Input
                        type="email"
                        value={judgeForm.email}
                        onChange={(e) => setJudgeForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Judge Experience</Label>
                    <Textarea
                      value={judgeForm.judge_experience}
                      onChange={(e) => setJudgeForm(prev => ({ ...prev, judge_experience: e.target.value }))}
                      placeholder="Describe your experience judging debates, tournaments, or similar events..."
                      className="min-h-24"
                    />
                  </div>
                  <div>
                    <Label>Debate Experience</Label>
                    <Textarea
                      value={judgeForm.debate_experience}
                      onChange={(e) => setJudgeForm(prev => ({ ...prev, debate_experience: e.target.value }))}
                      placeholder="Describe your experience with debate (as a debater, coach, audience member, etc.)..."
                      className="min-h-24"
                    />
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Please note that you might not be selected as a judge. We will review all applications and notify selected judges via email. Please wait for our email confirmation.
                    </p>
                  </div>
                  
                  <PrivacyContract />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="judge-privacy"
                      checked={judgeForm.privacy_accepted}
                      onCheckedChange={(checked) => setJudgeForm(prev => ({ ...prev, privacy_accepted: !!checked }))}
                    />
                    <Label htmlFor="judge-privacy">I accept the privacy agreement</Label>
                  </div>
                  
                  <Button onClick={handleJudgeApplication} className="w-full">
                    Submit Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            <Card className="opacity-60">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <CardTitle className="text-muted-foreground">Debater Registration Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Registration for debaters has been closed</p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader className="text-center">
                <Gavel className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <CardTitle className="text-muted-foreground">Judge Applications Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Applications for judges have been closed</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle>Go to Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">Access your tournament portal</p>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="Enter your registration email"
              />
            </div>
            <Button onClick={handlePortalAccess} className="w-full">
              Access Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};