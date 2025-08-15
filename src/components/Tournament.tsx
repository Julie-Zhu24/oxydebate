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
import { Users, Gavel, LogIn, Plus, Send, Check, X } from 'lucide-react';

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
  created_at: string;
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

  // Registration forms state
  const [debaterForm, setDebaterForm] = useState({
    name: '', email: '', school: '', partner_name: '', partner_email: '', team_name: '', privacy_accepted: false
  });
  const [judgeForm, setJudgeForm] = useState({
    name: '', email: '', judge_experience: '', debate_experience: '', privacy_accepted: false
  });

  // Admin announcement form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', target_type: 'all', target_team_name: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
    loadAnnouncements();
  }, [isAdmin]);

  const loadAdminData = async () => {
    try {
      const [debatersRes, judgesRes] = await Promise.all([
        supabase.from('tournament_debaters').select('*').order('created_at', { ascending: false }),
        supabase.from('tournament_judges').select('*').order('created_at', { ascending: false })
      ]);

      if (debatersRes.error) throw debatersRes.error;
      if (judgesRes.error) throw judgesRes.error;

      setDebaters(debatersRes.data || []);
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
      setAnnouncements(data || []);
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
    try {
      const [debaterRes, judgeRes] = await Promise.all([
        supabase.from('tournament_debaters').select('*').eq('email', portalEmail).maybeSingle(),
        supabase.from('tournament_judges').select('*').eq('email', portalEmail).eq('status', 'approved').maybeSingle()
      ]);

      if (debaterRes.data) {
        const teamAnnouncements = announcements.filter(a => 
          a.target_type === 'all' || 
          a.target_type === 'debaters' || 
          (a.target_type === 'team' && a.target_team_name === debaterRes.data.team_name)
        );
        setPortalData({ type: 'debater', data: debaterRes.data, announcements: teamAnnouncements });
        setShowPortal(true);
      } else if (judgeRes.data) {
        const judgeAnnouncements = announcements.filter(a => 
          a.target_type === 'all' || a.target_type === 'judges'
        );
        setPortalData({ type: 'judge', data: judgeRes.data, announcements: judgeAnnouncements });
        setShowPortal(true);
      } else {
        toast({ title: 'Access denied', description: 'Email not found in our records or application not approved.', variant: 'destructive' });
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
      setAnnouncementForm({ title: '', content: '', target_type: 'all', target_team_name: '' });
      loadAnnouncements();
    } catch (error: any) {
      toast({ title: 'Failed to create announcement', description: error.message, variant: 'destructive' });
    }
  };

  const getTeamNames = () => {
    return [...new Set(debaters.map(d => d.team_name))];
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
        <h1 className="text-3xl font-bold">Tournament Administration</h1>

        <Tabs defaultValue="debaters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="debaters">Debaters ({debaters.length})</TabsTrigger>
            <TabsTrigger value="judges">Judges ({judges.length})</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="send">Send Announcement</TabsTrigger>
          </TabsList>

          <TabsContent value="debaters" className="space-y-4">
            <div className="grid gap-4">
              {debaters.map((debater) => (
                <Card key={debater.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Team: {debater.team_name}</span>
                      <Badge>{debater.school}</Badge>
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
                    {judge.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => updateJudgeStatus(judge.id, 'approved')}>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => updateJudgeStatus(judge.id, 'rejected')}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
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
                        {announcement.target_type === 'team' ? `Team: ${announcement.target_team_name}` : announcement.target_type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
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
                <div>
                  <Label>Target</Label>
                  <select
                    value={announcementForm.target_type}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target_type: e.target.value, target_team_name: '' }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Participants</option>
                    <option value="debaters">All Debaters</option>
                    <option value="judges">All Judges</option>
                    <option value="team">Specific Team</option>
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
                <Button onClick={createAnnouncement} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>
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