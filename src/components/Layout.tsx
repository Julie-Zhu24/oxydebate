
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from './Navigation';
import { AIPractice } from './AIPractice';
import { RealGlobalPractice } from './RealGlobalPractice';
import { RealRankings } from './RealRankings';
import { Posts } from './Posts';
import { DynamicBackground } from './DynamicBackground';
import { Button } from '@/components/ui/button';

export type Section = 'ai-practice' | 'global-practice' | 'rankings' | 'content';

export const Layout = () => {
  const [activeSection, setActiveSection] = useState<Section>('ai-practice');
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

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
      default:
        return <AIPractice />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isAuthenticated={true}
        onLogout={signOut}
      />
      <main className="container mx-auto px-4 py-8">
        {renderSection()}
      </main>
    </div>
  );
};
