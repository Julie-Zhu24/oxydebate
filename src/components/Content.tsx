
import { useState } from 'react';
import { Plus, Search, ThumbsUp, MessageCircle, Play, Mic, User, Send } from 'lucide-react';

interface Post {
  id: string;
  type: 'post' | 'podcast';
  title: string;
  content: string;
  author: string;
  date: string;
  likes: number;
  comments: Comment[];
  channel: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
}

export const Content = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      type: 'post',
      title: 'Advanced Rebuttal Strategies in WSDC',
      content: 'Today I want to discuss some advanced rebuttal techniques that can elevate your debate performance...',
      author: 'DebateMaster2024',
      date: '2024-01-15',
      likes: 24,
      comments: [
        {
          id: 'c1',
          author: 'StudentDebater',
          content: 'This is really helpful! Could you elaborate on the timing of rebuttals?',
          date: '2024-01-16',
          likes: 3
        }
      ],
      channel: 'WSDC Strategies'
    },
    {
      id: '2',
      type: 'podcast',
      title: 'Debate Analysis: Climate Change Motion',
      content: 'In this episode, we break down a championship-level debate on climate policy...',
      author: 'DebateCoach',
      date: '2024-01-10',
      likes: 45,
      comments: [],
      channel: 'Weekly Analysis'
    }
  ]);

  const [newPost, setNewPost] = useState({
    type: 'post' as 'post' | 'podcast',
    title: '',
    content: '',
    channel: ''
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const addComment = (postId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'CurrentUser', // This would come from auth context
      content: newComment,
      date: new Date().toISOString().split('T')[0],
      likes: 0
    };

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
    }

    setNewComment('');
  };

  const createPost = () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.channel.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      type: newPost.type,
      title: newPost.title,
      content: newPost.content,
      author: 'CurrentUser', // This would come from auth context
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      comments: [],
      channel: newPost.channel
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ type: 'post', title: '', content: '', channel: '' });
    setActiveTab('browse');
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedPost(null)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Content
        </button>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            {selectedPost.type === 'podcast' ? <Mic size={20} /> : <MessageCircle size={20} />}
            <span className="text-sm text-muted-foreground">{selectedPost.channel}</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{selectedPost.title}</h1>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span>{selectedPost.author}</span>
            </div>
            <span>{formatDate(selectedPost.date)}</span>
            <div className="flex items-center space-x-1">
              <ThumbsUp size={14} />
              <span>{selectedPost.likes}</span>
            </div>
          </div>

          {selectedPost.type === 'podcast' && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6 flex items-center space-x-4">
              <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors">
                <Play size={20} />
              </button>
              <div>
                <p className="font-medium">Audio Episode</p>
                <p className="text-sm text-muted-foreground">Click to play podcast</p>
              </div>
            </div>
          )}

          <div className="text-muted-foreground mb-8 whitespace-pre-line">
            {selectedPost.content}
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Comments ({selectedPost.comments.length})</h3>
            
            {/* Add Comment */}
            <div className="flex space-x-3 mb-6">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                U
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
                <button
                  onClick={() => addComment(selectedPost.id)}
                  className="mt-2 flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Send size={16} />
                  <span>Comment</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {selectedPost.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm">
                    {comment.author[0]}
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
                        <ThumbsUp size={12} />
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts & Podcasts</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'browse' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'create' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search posts and podcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Content List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {post.type === 'podcast' ? <Mic className="text-primary" size={20} /> : <MessageCircle className="text-primary" size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        {post.channel}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(post.date)}</span>
                    </div>
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {post.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>by {post.author}</span>
                      <div className="flex items-center space-x-1">
                        <ThumbsUp size={14} />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={14} />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Create Content Form */
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Create New Content</h2>
          
          <div className="space-y-4">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setNewPost(prev => ({ ...prev, type: 'post' }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    newPost.type === 'post' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted'
                  }`}
                >
                  <MessageCircle size={18} />
                  <span>Post</span>
                </button>
                <button
                  onClick={() => setNewPost(prev => ({ ...prev, type: 'podcast' }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    newPost.type === 'podcast' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted'
                  }`}
                >
                  <Mic size={18} />
                  <span>Podcast</span>
                </button>
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium mb-2">Channel Name</label>
              <input
                type="text"
                placeholder="e.g., WSDC Strategies, Debate Tips, etc."
                value={newPost.channel}
                onChange={(e) => setNewPost(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                placeholder="Enter a compelling title..."
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                placeholder={newPost.type === 'podcast' ? 'Describe your podcast episode...' : 'Write your post content...'}
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={8}
              />
            </div>

            {/* Submit */}
            <button
              onClick={createPost}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              <span>Create {newPost.type === 'podcast' ? 'Podcast' : 'Post'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
