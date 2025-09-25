import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { Bell } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SafeHTML } from './SafeHTML';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export const Announcements = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useRoles();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const sb = supabase as any;
      const { data, error } = await sb
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      setAnnouncements((data || []) as Announcement[]);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load announcements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const saveAnnouncement = async (publish: boolean) => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Please complete title and content' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        content: content.trim(),
        is_published: publish,
        created_by_user_id: user.id,
      };
      if (publish) payload.published_at = new Date().toISOString();

      const { error } = await (supabase as any).from('announcements').insert(payload);
      if (error) throw error;

      toast({ title: publish ? 'Announcement published' : 'Draft saved' });
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('announcements')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('announcements').getPublicUrl(path);
      const url = data.publicUrl;
      setContent((prev) => `${prev || ''}<p><img src="${url}" alt="announcement image" /></p>`);
      toast({ title: 'Image added to announcement' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Announcement deleted' });
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const quillModules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean']
    ],
  } as const;

  return (
    <section id="announcements" className="container mx-auto px-4 py-16 md:py-20">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold">Announcements</h2>
        <button
          onClick={() => {
            document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth' });
          }}
          aria-label="Jump to announcements"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>

      {isAdmin && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="border border-border rounded-md overflow-hidden bg-card">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">
                Add image:
                <input
                  type="file"
                  accept="image/*"
                  className="ml-2"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveAnnouncement(true)} disabled={saving}>
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
              <Button variant="outline" onClick={() => saveAnnouncement(false)} disabled={saving}>
                {saving ? 'Saving...' : 'Save draft'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground flex items-center gap-3">
            <Bell className="h-4 w-4" />
            No announcements yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
          {announcements.map((a) => (
            <Collapsible key={a.id} className="min-w-80 max-w-80 p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm" style={{ scrollSnapAlign: 'start' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{a.title}</h3>
                    <p className="text-xs text-muted-foreground">{a.published_at ? new Date(a.published_at).toLocaleString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Toggle announcement">Read more</Button>
                  </CollapsibleTrigger>
                  {isAdmin && (
                    <Button variant="destructive" size="sm" onClick={() => deleteAnnouncement(a.id)}>Delete</Button>
                  )}
                </div>
              </div>
              <CollapsibleContent className="mt-4">
                <SafeHTML 
                  content={a.content} 
                  className="space-y-3 text-sm leading-relaxed"
                />
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </section>
  );
};
