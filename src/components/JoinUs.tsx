import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Crown, Users } from 'lucide-react';

interface ApplicationForm {
  name: string;
  email: string;
  organizationSchool: string;
  message: string;
  desiredPosition?: string;
}

export const JoinUs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cohostForm, setCohostForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    organizationSchool: '',
    message: ''
  });
  const [managementForm, setManagementForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    organizationSchool: '',
    message: '',
    desiredPosition: ''
  });
  const [openDialog, setOpenDialog] = useState<'cohost' | 'management' | null>(null);

  const handleSubmit = async (type: 'cohost' | 'management') => {
    const form = type === 'cohost' ? cohostForm : managementForm;
    
    if (!form.name || !form.email || !form.organizationSchool || !form.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (type === 'management' && !form.desiredPosition) {
      toast({
        title: "Missing Information", 
        description: "Please specify the position you want",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user?.id || null,
          application_type: type,
          name: form.name,
          email: form.email,
          organization_school: form.organizationSchool,
          message: form.message,
          desired_position: type === 'management' ? form.desiredPosition : null
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your ${type === 'cohost' ? 'tournament cohost' : 'management team'} application has been submitted successfully!`
      });

      // Reset form
      if (type === 'cohost') {
        setCohostForm({ name: '', email: '', organizationSchool: '', message: '' });
      } else {
        setManagementForm({ name: '', email: '', organizationSchool: '', message: '', desiredPosition: '' });
      }
      
      setOpenDialog(null);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FormFields = ({ type, form, setForm }: { 
    type: 'cohost' | 'management', 
    form: ApplicationForm, 
    setForm: React.Dispatch<React.SetStateAction<ApplicationForm>> 
  }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${type}-name`}>Full Name *</Label>
        <Input
          id={`${type}-name`}
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter your full name"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor={`${type}-email`}>Email Address *</Label>
        <Input
          id={`${type}-email`}
          type="email"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter your email address"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor={`${type}-org`}>Organization/School *</Label>
        <Input
          id={`${type}-org`}
          value={form.organizationSchool}
          onChange={(e) => setForm(prev => ({ ...prev, organizationSchool: e.target.value }))}
          placeholder="Enter your organization or school name"
          className="mt-1"
        />
      </div>

      {type === 'management' && (
        <div>
          <Label htmlFor={`${type}-position`}>Desired Position *</Label>
          <Input
            id={`${type}-position`}
            value={form.desiredPosition || ''}
            onChange={(e) => setForm(prev => ({ ...prev, desiredPosition: e.target.value }))}
            placeholder="e.g., Content Manager, Technical Lead, Marketing Coordinator"
            className="mt-1"
          />
        </div>
      )}

      <div>
        <Label htmlFor={`${type}-message`}>Tell us about yourself *</Label>
        <Textarea
          id={`${type}-message`}
          value={form.message}
          onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Share your experience, motivations, and what you'd bring to the role..."
          className="mt-1 min-h-[120px]"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Help us grow the Oxymorona Debate Community! We're looking for passionate individuals 
          to join our mission of making debate accessible to everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tournament Cohost Application */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Tournament Cohost</CardTitle>
            <CardDescription>
              Help organize and run our tournaments as a cohost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
              <li>• Assist in tournament planning and execution</li>
              <li>• Help coordinate participants and schedules</li>
              <li>• Support live tournament operations</li>
              <li>• Contribute to post-tournament analysis</li>
            </ul>
            
            <Dialog open={openDialog === 'cohost'} onOpenChange={(open) => setOpenDialog(open ? 'cohost' : null)}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                  Apply to be Cohost
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tournament Cohost Application</DialogTitle>
                  <DialogDescription>
                    Tell us about your interest in helping organize tournaments
                  </DialogDescription>
                </DialogHeader>
                
                <FormFields 
                  type="cohost" 
                  form={cohostForm} 
                  setForm={setCohostForm} 
                />
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setOpenDialog(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSubmit('cohost')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Management Team Application */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Management Team</CardTitle>
            <CardDescription>
              Join our core team and help shape the future of our community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6 text-sm text-muted-foreground">
              <li>• Content creation and curation</li>
              <li>• Community engagement and growth</li>
              <li>• Platform development and improvement</li>
              <li>• Strategic planning and execution</li>
            </ul>
            
            <Dialog open={openDialog === 'management'} onOpenChange={(open) => setOpenDialog(open ? 'management' : null)}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full" variant="secondary">
                  Join Management Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Management Team Application</DialogTitle>
                  <DialogDescription>
                    Tell us about your skills and the role you'd like to take on
                  </DialogDescription>
                </DialogHeader>
                
                <FormFields 
                  type="management" 
                  form={managementForm} 
                  setForm={setManagementForm} 
                />
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setOpenDialog(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSubmit('management')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-3">What happens next?</h3>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p>1. We'll review your application within 3-5 business days</p>
              <p>2. If selected, we'll reach out for a brief interview</p>
              <p>3. Successful candidates will be onboarded to their respective teams</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};