
import { useState, useEffect } from 'react';
import { Search, Shuffle, ArrowLeft, ExternalLink, Filter } from 'lucide-react';

interface TopicSelectorProps {
  onTopicSelected: (topic: string) => void;
  onBack: () => void;
}

interface Topic {
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const TopicSelector = ({ onTopicSelected, onBack }: TopicSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customTopic, setCustomTopic] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock topics data (in real implementation, this would come from the API)
  const mockTopics: Topic[] = [
    {
      title: "This House believes that social media does more harm than good",
      description: "Debate the impact of social media on society, mental health, and democracy",
      category: "Technology",
      difficulty: "Intermediate"
    },
    {
      title: "This House would ban private healthcare",
      description: "Examine the role of private healthcare in modern society",
      category: "Healthcare",
      difficulty: "Advanced"
    },
    {
      title: "This House believes that standardized testing should be abolished",
      description: "Debate the effectiveness and fairness of standardized testing",
      category: "Education",
      difficulty: "Beginner"
    },
    {
      title: "This House would implement a universal basic income",
      description: "Explore the economic and social implications of UBI",
      category: "Economics",
      difficulty: "Advanced"
    },
    {
      title: "This House believes that animals should have the same rights as humans",
      description: "Debate animal rights and ethical treatment",
      category: "Ethics",
      difficulty: "Intermediate"
    },
    {
      title: "This House would ban single-use plastics",
      description: "Examine environmental policy and corporate responsibility",
      category: "Environment",
      difficulty: "Beginner"
    }
  ];

  const categories = ['all', 'Technology', 'Healthcare', 'Education', 'Economics', 'Ethics', 'Environment', 'Politics', 'Social Issues'];

  useEffect(() => {
    setTopics(mockTopics);
  }, []);

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRandomTopic = () => {
    const randomTopic = mockTopics[Math.floor(Math.random() * mockTopics.length)];
    onTopicSelected(randomTopic.title);
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      onTopicSelected(customTopic.trim());
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Setup</span>
        </button>
        <h1 className="text-2xl font-bold">Choose Your Topic</h1>
        <div></div>
      </div>

      {/* Search and Filters */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        <button
          onClick={getRandomTopic}
          className="flex items-center justify-center space-x-2 px-4 py-3 gold-gradient text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Shuffle size={20} />
          <span>Random</span>
        </button>
      </div>

      {/* Custom Topic */}
      <div className="border rounded-lg p-6 bg-muted/30">
        <h3 className="text-lg font-semibold mb-3">Create Custom Topic</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter your own debate motion..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
          />
          <button
            onClick={handleCustomTopicSubmit}
            disabled={!customTopic.trim()}
            className="px-6 py-3 debate-gradient text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Practice
          </button>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopics.map((topic, index) => (
          <div key={index} className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
                  {topic.difficulty}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {topic.category}
                </span>
              </div>
              
              <h3 className="font-semibold text-sm leading-tight">
                {topic.title}
              </h3>
              
              <p className="text-muted-foreground text-sm">
                {topic.description}
              </p>
              
              <button
                onClick={() => onTopicSelected(topic.title)}
                className="w-full py-2 px-4 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Select Topic
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
