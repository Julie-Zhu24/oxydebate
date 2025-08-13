import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface DebateLesson {
  id: string;
  title: string;
  description: string | null;
  video_path: string | null;
  text_path: string | null;
  is_published: boolean;
  created_at: string;
}

export const DebateGuide = () => {
  const { user } = useAuth();
  const { isAdmin } = useRoles();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<DebateLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // New lesson form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchLessons = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('debate_lessons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLessons(data || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load lessons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const uploadToBucket = async (path: string, file: File) => {
    const { error } = await supabase.storage
      .from('debate-guides')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return path;
  };

  const publicUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('debate-guides').getPublicUrl(path);
    return data.publicUrl;
  };

  const createLesson = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: 'Please enter a lesson name' });
      return;
    }

    setSaving(true);
    try {
      // Create the row first to obtain an id
      const { data: row, error: insertErr } = await (supabase as any)
        .from('debate_lessons')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          is_published: publishNow,
          created_by_user_id: user.id,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      let video_path: string | null = null;
      let text_path: string | null = null;

      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        video_path = `lessons/${row.id}/video.${ext}`;
        await uploadToBucket(video_path, videoFile);
      }
      if (textFile) {
        const ext = textFile.name.split('.').pop();
        text_path = `lessons/${row.id}/text.${ext}`;
        await uploadToBucket(text_path, textFile);
      }

      if (video_path || text_path) {
        const { error: updErr } = await (supabase as any)
          .from('debate_lessons')
          .update({ video_path, text_path })
          .eq('id', row.id);
        if (updErr) throw updErr;
      }

      toast({ title: 'Lesson created' });
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setTextFile(null);
      setPublishNow(false);
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('debate_lessons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Lesson deleted' });
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const updateLessonMeta = async (lesson: DebateLesson, updates: Partial<DebateLesson>) => {
    try {
      const { error } = await (supabase as any)
        .from('debate_lessons')
        .update(updates)
        .eq('id', lesson.id);
      if (error) throw error;
      toast({ title: 'Lesson updated' });
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const reuploadFiles = async (lesson: DebateLesson, newVideo?: File, newText?: File) => {
    try {
      let video_path = lesson.video_path;
      let text_path = lesson.text_path;

      if (newVideo) {
        const ext = newVideo.name.split('.').pop();
        video_path = `lessons/${lesson.id}/video.${ext}`;
        await uploadToBucket(video_path, newVideo);
      }
      if (newText) {
        const ext = newText.name.split('.').pop();
        text_path = `lessons/${lesson.id}/text.${ext}`;
        await uploadToBucket(text_path, newText);
      }

      const { error } = await (supabase as any)
        .from('debate_lessons')
        .update({ video_path, text_path })
        .eq('id', lesson.id);
      if (error) throw error;
      toast({ title: 'Files updated' });
      fetchLessons();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <section className="space-y-8">
      {/* Admin create form */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create a lesson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Lesson name" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Video file</label>
                <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Text file (PDF, TXT, DOC)</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setTextFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="publishNow" checked={publishNow} onCheckedChange={setPublishNow} />
              <label htmlFor="publishNow" className="text-sm">Publish immediately</label>
            </div>

            <Button onClick={createLesson} disabled={saving}>{saving ? 'Saving…' : 'Create lesson'}</Button>
          </CardContent>
        </Card>
      )}

      {/* Lessons list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : lessons.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">No lessons yet.</CardContent>
          </Card>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <span>{lesson.title}</span>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => updateLessonMeta(lesson, { is_published: !lesson.is_published })}>
                        {lesson.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteLesson(lesson.id)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lesson.description && (
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                )}

                {lesson.video_path && (
                  <video controls className="w-full rounded-md border border-border">
                    <source src={publicUrl(lesson.video_path) || ''} />
                  </video>
                )}

                {lesson.text_path && (
                  <a
                    href={publicUrl(lesson.text_path) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline text-sm"
                  >
                    View attached text
                  </a>
                )}

                {isAdmin && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Rename lesson</label>
                      <div className="flex gap-2">
                        <Input defaultValue={lesson.title} onBlur={(e) => {
                          const newTitle = e.target.value.trim();
                          if (newTitle && newTitle !== lesson.title) updateLessonMeta(lesson, { title: newTitle });
                        }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Reupload video</label>
                        <input type="file" accept="video/*" onChange={(e) => e.target.files && reuploadFiles(lesson, e.target.files[0], undefined)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Reupload text</label>
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => e.target.files && reuploadFiles(lesson, undefined, e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};
