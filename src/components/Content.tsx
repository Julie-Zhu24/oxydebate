
import { useState } from 'react';
import { BookOpen, Mic, Play, Clock, Eye, Heart, MessageSquare, Share } from 'lucide-react';

export const Content = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'podcasts'>('posts');

  const mockPosts = [
    {
      id: 1,
      title: "Mastering the Art of Rebuttal: Advanced Techniques",
      author: "Dr. Sarah Johnson",
      authorAvatar: "SJ",
      excerpt: "Learn how to effectively dismantle opposing arguments while building your own case stronger...",
      readTime: "8 min read",
      likes: 342,
      comments: 28,
      views: 1205,
      publishedAt: "2 days ago",
      tags: ["Rebuttal", "Advanced", "Technique"]
    },
    {
      id: 2,
      title: "The Psychology of Persuasion in Competitive Debate",
      author: "Prof. Michael Chen",
      authorAvatar: "MC",
      excerpt: "Understanding cognitive biases and how to leverage them ethically in your arguments...",
      readTime: "12 min read",
      likes: 189,
      comments: 15,
      views: 843,
      publishedAt: "5 days ago",
      tags: ["Psychology", "Persuasion", "Strategy"]
    },
    {
      id: 3,
      title: "Breaking Down WSDC Finals: Cambridge vs Oxford Analysis",
      author: "Emma Thompson",
      authorAvatar: "ET",
      excerpt: "A detailed breakdown of the strategic choices made in this historic final round...",
      readTime: "15 min read",
      likes: 456,
      comments: 67,
      views: 2104,
      publishedAt: "1 week ago",
      tags: ["WSDC", "Analysis", "Finals"]
    }
  ];

  const mockPodcasts = [
    {
      id: 1,
      title: "Debate Arena Weekly: Episode 47 - AI in Education",
      host: "Marcus Williams & Lisa Zhang",
      duration: "45:23",
      description: "This week we explore how artificial intelligence is reshaping educational debates...",
      plays: 2847,
      publishedAt: "3 days ago",
      imageUrl: "MW"
    },
    {
      id: 2,
      title: "Master Class: Interview with World Champion Debater",
      host: "Debate Arena",
      duration: "62:15",
      description: "An exclusive interview with 2023 World Schools champion sharing their journey...",
      plays: 5632,
      publishedAt: "1 week ago",
      imageUrl: "DA"
    },
    {
      id: 3,
      title: "Quick Tips: 5-Minute Debate Drills for Busy Students",
      host: "Coach Rivera",
      duration: "18:44",
      description: "Practical exercises you can do anywhere to improve your debate skills...",
      plays: 1924,
      publishedAt: "2 weeks ago",
      imageUrl: "CR"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center">
            <BookOpen className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold">Posts & Podcasts</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Learn from experts and stay updated with the debate community
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={18} />
            <span>Articles</span>
          </button>
          <button
            onClick={() => setActiveTab('podcasts')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'podcasts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic size={18} />
            <span>Podcasts</span>
          </button>
        </div>
      </div>

      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Featured Post */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                SJ
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  FEATURED
                </span>
                <h2 className="text-2xl font-bold mt-2 mb-3">
                  The Complete Guide to Motion Analysis in Competitive Debate
                </h2>
                <p className="text-muted-foreground mb-4">
                  Master the art of breaking down debate motions with this comprehensive guide covering definition, implications, and strategic frameworks...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Dr. Sarah Johnson</span>
                    <span>•</span>
                    <span>20 min read</span>
                    <span>•</span>
                    <span>Featured Article</span>
                  </div>
                  <button className="px-4 py-2 debate-gradient text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Read Article
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {mockPosts.map((post) => (
              <article key={post.id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {post.authorAvatar}
                    </div>
                    <div>
                      <h4 className="font-medium">{post.author}</h4>
                      <p className="text-xs text-muted-foreground">{post.publishedAt}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold leading-tight">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground text-sm">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{post.readTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye size={14} />
                        <span>{post.views}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <button className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors">
                        <Heart size={14} />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare size={14} />
                        <span>{post.comments}</span>
                      </button>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <Share size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'podcasts' && (
        <div className="space-y-6">
          {mockPodcasts.map((podcast) => (
            <div key={podcast.id} className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {podcast.imageUrl}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{podcast.title}</h3>
                    <p className="text-sm text-muted-foreground">by {podcast.host}</p>
                  </div>
                  
                  <p className="text-muted-foreground text-sm">
                    {podcast.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{podcast.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Play size={14} />
                      <span>{podcast.plays} plays</span>
                    </div>
                    <span>•</span>
                    <span>{podcast.publishedAt}</span>
                  </div>
                </div>
                
                <button className="flex items-center space-x-2 px-6 py-3 debate-gradient text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                  <Play size={18} />
                  <span>Play</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
