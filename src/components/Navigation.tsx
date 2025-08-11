import { Menu, LogOut } from 'lucide-react';
import { Section } from './Layout';
import { useState } from 'react';

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Navigation = ({ activeSection, onSectionChange, isAuthenticated, onLogout }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'ai-practice' as Section, label: 'AI Practice' },
    { id: 'global-practice' as Section, label: 'Global Practice' },
    { id: 'rankings' as Section, label: 'Rankings' },
    { id: 'content' as Section, label: 'Posts & Podcasts' },
  ];

  return (
    <nav className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/38ceb41b-5f98-475f-8a33-19dc45ce9689.png"
              alt="Oxymorona Debate logo"
              className="h-9 w-9 object-contain"
              loading="lazy"
            />
            <span className="font-playfair text-xl md:text-2xl font-semibold">Oxymorona Debate</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`font-playfair text-sm md:text-base transition-colors ${
                    isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 font-playfair transition-colors ${
                    isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {isAuthenticated && (
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
