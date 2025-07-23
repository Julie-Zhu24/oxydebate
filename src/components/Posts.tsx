import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Play, Pause, Mic, Square, Upload } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: string;
  audio_url?: string | null;
  video_url?: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url?: string | null;
  } | null;
}

export const Posts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    tags: string;
    post_type: 'text' | 'audio' | 'video';
  }>({
    title: '',
    content: '',
    tags: '',
    post_type: 'text'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{[postId: string]: any[]}>({});
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // First get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get unique user IDs
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      
      // Fetch profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

      // Combine posts with their profiles
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesMap.get(post.user_id) || null
      })) || [];

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const createPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    setCreating(true);
    try {
      let audioUrl = null;
      
      if (newPost.post_type === 'audio' && audioBlob) {
        // Upload audio file to Supabase Storage (would need storage bucket setup)
        // For now, we'll just indicate it's an audio post
        audioUrl = 'placeholder-audio-url';
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          post_type: newPost.post_type,
          audio_url: audioUrl,
          tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      setNewPost({ title: '', content: '', tags: '', post_type: 'text' });
      setShowCreateForm(false);
      setAudioBlob(null);
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        toast({
          title: "Unlike",
          description: "Removed like from post",
        });
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
        
        toast({
          title: "Liked!",
          description: "Added like to post",
        });
      }

      fetchPosts(); // Refresh to get updated counts
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get user profiles for comment authors
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
      
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profile: profilesMap.get(comment.user_id) || null
      })) || [];

      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
      
      fetchPosts(); // Refresh to get updated counts
      fetchComments(postId); // Refresh comments for this post
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const playAudio = async (audioUrl: string, postId: string) => {
    if (playingAudio === postId) {
      // Stop current audio
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      setPlayingAudio(null);
      return;
    }

    try {
      setPlayingAudio(postId);
      
      // For now, create a simple audio element for testing
      // In a real implementation, you would use the actual audio URL from storage
      const audio = new Audio();
      
      // Generate a simple test tone for demonstration
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
      
      setTimeout(() => {
        setPlayingAudio(null);
        audioContext.close();
      }, 2000);
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
      toast({
        title: "Error",
        description: "Could not play audio",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-pulse">Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Community Posts
          </h1>
          <p className="text-muted-foreground">Share your debates, insights, and audio content</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          Create Post
        </Button>
      </div>

      {showCreateForm && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>Share your thoughts with the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={newPost.post_type === 'text' ? 'default' : 'outline'}
                onClick={() => setNewPost(prev => ({ ...prev, post_type: 'text' as const }))}
                size="sm"
              >
                Text
              </Button>
              <Button
                variant={newPost.post_type === 'audio' ? 'default' : 'outline'}
                onClick={() => setNewPost(prev => ({ ...prev, post_type: 'audio' as const }))}
                size="sm"
              >
                Audio
              </Button>
            </div>

            <Input
              placeholder="Post title"
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
            />

            <Textarea
              placeholder="What's on your mind?"
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
            />

            {newPost.post_type === 'audio' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? 'text-red-500' : ''}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                  {audioBlob && (
                    <Badge variant="secondary">Audio recorded</Badge>
                  )}
                </div>
              </div>
            )}

            <Input
              placeholder="Tags (comma separated)"
              value={newPost.tags}
              onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
            />

            <div className="flex gap-2">
              <Button 
                onClick={createPost} 
                disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
              >
                {creating ? 'Creating...' : 'Create Post'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-border/30">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="bg-card/50 backdrop-blur-sm border-border/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback>
                      {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.profiles?.display_name || post.profiles?.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={post.post_type === 'audio' ? 'default' : 'secondary'}>
                    {post.post_type}
                  </Badge>
                </div>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-foreground/90">{post.content}</p>
                
                {post.post_type === 'audio' && post.audio_url && (
                  <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(post.audio_url!, post.id)}
                    >
                      {playingAudio === post.id ? 
                        <Pause className="w-4 h-4" /> : 
                        <Play className="w-4 h-4" />
                      }
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {playingAudio === post.id ? 'Playing...' : 'Audio Post'}
                    </span>
                  </div>
                )}

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id)}
                    className="gap-2 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    {post.likes_count}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      if (showComments === post.id) {
                        setShowComments(null);
                      } else {
                        setShowComments(post.id);
                        fetchComments(post.id);
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.comments_count}
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>

                {showComments === post.id && (
                  <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addComment(post.id);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => addComment(post.id)}
                        disabled={!newComment.trim()}
                        size="sm"
                      >
                        Post
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {comments[post.id]?.length > 0 ? (
                        comments[post.id].map((comment: any) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-secondary/10 rounded-lg">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.profile?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {comment.profile?.display_name?.[0] || comment.profile?.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {comment.profile?.display_name || comment.profile?.username}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};