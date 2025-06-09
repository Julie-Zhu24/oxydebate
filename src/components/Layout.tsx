
import { useState } from 'react';
import { Navigation } from './Navigation';
import { AIPractice } from './AIPractice';
import { GlobalPractice } from './GlobalPractice';
import { Rankings } from './Rankings';
import { Content } from './Content';
import { AuthModal } from './AuthModal';
import { DynamicBackground } from './DynamicBackground';

export type Section = 'ai-practice' | 'global-practice' | 'rankings' | 'content';

export const Layout = () => {
  const [activeSection, setActiveSection] = useState<Section>('ai-practice');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSectionChange = (section: Section) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setActiveSection(section);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const renderSection = () => {
    if (!isAuthenticated) {
      return (
        <div className="relative flex items-center justify-center min-h-[80vh]">
          <DynamicBackground />
          <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-6 bg-background/80 backdrop-blur-sm rounded-2xl p-8 border">
            <div className="w-20 h-20 mx-auto debate-gradient rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">DA</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Debate Arena
            </h1>
            <p className="text-muted-foreground">
              Practice with AI, compete globally, and master the art of debate
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 debate-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'ai-practice':
        return <AIPractice />;
      case 'global-practice':
        return <GlobalPractice />;
      case 'rankings':
        return <Rankings />;
      case 'content':
        return <Content />;
      default:
        return <AIPractice />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isAuthenticated={isAuthenticated}
        onLogout={() => setIsAuthenticated(false)}
      />
      <main className="container mx-auto px-4 py-8">
        {renderSection()}
      </main>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};
