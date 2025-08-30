
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from './Navigation';
import { AIPractice } from './AIPractice';
import { RealGlobalPractice } from './RealGlobalPractice';
import { RealRankings } from './RealRankings';
import { Posts } from './Posts';
import { DynamicBackground } from './DynamicBackground';
import { Button } from '@/components/ui/button';
import { ComingSoon } from '@/components/ComingSoon';
import { MyProgress } from '@/components/MyProgress';
import { Feedback } from '@/components/Feedback';
import { DebateGuide } from '@/components/DebateGuide';
import { JoinUs } from '@/components/JoinUs';
import Tournament from '@/components/Tournament';

export type Section = 'ai-practice' | 'global-practice' | 'rankings' | 'content' | 'tournament' | 'global-news' | 'debate-guide' | 'my-progress' | 'join-us' | 'feedback';

export const Layout = () => {
  const [activeSection, setActiveSection] = useState<Section>('ai-practice');
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!loading && !user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  // Initialize section from query param if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get('section') as Section | null;
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, []);

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'ai-practice':
        return <AIPractice />;
      case 'global-practice':
        return <RealGlobalPractice />;
      case 'rankings':
        return <RealRankings />;
      case 'content':
        return <Posts />;
      case 'tournament':
        return <Tournament />;
      case 'global-news':
        return <ComingSoon title="Global News" message="Stay tuned. This section is coming soon." />;
      case 'debate-guide':
        return <DebateGuide />;
      case 'join-us':
        return <JoinUs />;
      case 'my-progress':
        return <MyProgress />;
      case 'feedback':
        return <Feedback />;
      default:
        return <AIPractice />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isAuthenticated={!!user}
        onLogout={signOut}
      />
      <main className="container mx-auto px-4 py-8">
        {renderSection()}
      </main>
    </div>
  );
};
