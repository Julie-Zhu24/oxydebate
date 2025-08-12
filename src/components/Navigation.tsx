import { Menu, LogOut } from 'lucide-react';
import { Section } from './Layout';
import { useState, useRef } from 'react';

interface NavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Navigation = ({ activeSection, onSectionChange, isAuthenticated, onLogout }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | 'practice' | 'resource' | 'mydebate'>(null);
  const closeTimeout = useRef<number | null>(null);

  const handleOpen = (menu: 'practice' | 'resource' | 'mydebate') => {
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpenMenu(menu);
  };

  const handleCloseWithDelay = () => {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    closeTimeout.current = window.setTimeout(() => setOpenMenu(null), 120);
  };
  const navigationItems = [
    { id: 'ai-practice' as Section, label: 'AI Practice' },
    { id: 'global-practice' as Section, label: 'Global Practice' },
    { id: 'rankings' as Section, label: 'Rankings' },
    { id: 'content' as Section, label: 'Posts & Podcasts' },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
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
          <div className="hidden md:flex items-center gap-8 ml-auto">
            {/* Practice menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleOpen('practice')}
              onMouseLeave={handleCloseWithDelay}
            >
              <button className={`font-playfair text-sm md:text-base transition-colors ${['ai-practice','global-practice','rankings'].includes(activeSection) ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                Practice
              </button>
              {openMenu === 'practice' && (
                <div className="absolute left-0 mt-2 bg-card border shadow-lg rounded-md py-2 w-56 z-50">
                  <button onClick={() => onSectionChange('ai-practice')} className="block w-full text-left px-4 py-2 hover:text-primary">AI Practice</button>
                  <button onClick={() => onSectionChange('global-practice')} className="block w-full text-left px-4 py-2 hover:text-primary">Global Practice</button>
                  <button onClick={() => onSectionChange('rankings')} className="block w-full text-left px-4 py-2 hover:text-primary">Rankings</button>
                </div>
              )}
            </div>

            {/* Tournament */}
            <button onClick={() => onSectionChange('tournament')} className={`font-playfair text-sm md:text-base transition-colors ${activeSection === 'tournament' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Tournament
            </button>

            {/* Resource menu */}
            <div 
              className="relative"
              onMouseEnter={() => handleOpen('resource')}
              onMouseLeave={handleCloseWithDelay}
            >
              <button className={`font-playfair text-sm md:text-base transition-colors ${['content','global-news','debate-guide'].includes(activeSection) ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                Resource
              </button>
              {openMenu === 'resource' && (
                <div className="absolute left-0 mt-2 bg-card border shadow-lg rounded-md py-2 w-56 z-50">
                  <button onClick={() => onSectionChange('content')} className="block w-full text-left px-4 py-2 hover:text-primary">Posts & Podcasts</button>
                  <button onClick={() => onSectionChange('global-news')} className="block w-full text-left px-4 py-2 hover:text-primary">Global News</button>
                  <button onClick={() => onSectionChange('debate-guide')} className="block w-full text-left px-4 py-2 hover:text-primary">Debate Guide</button>
                </div>
              )}
            </div>

            {/* My Debate */}
            <div 
              className="relative"
              onMouseEnter={() => handleOpen('mydebate')}
              onMouseLeave={handleCloseWithDelay}
            >
              <button className={`font-playfair text-sm md:text-base transition-colors ${['my-progress','join-us','feedback'].includes(activeSection) ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
                My Debate
              </button>
              {openMenu === 'mydebate' && (
                <div className="absolute left-0 mt-2 bg-card border shadow-lg rounded-md py-2 w-56 z-50">
                  <button onClick={() => onSectionChange('my-progress')} className="block w-full text-left px-4 py-2 hover:text-primary">My Progress</button>
                  <button onClick={() => onSectionChange('join-us')} className="block w-full text-left px-4 py-2 hover:text-primary">Join Us</button>
                  <button onClick={() => onSectionChange('feedback')} className="block w-full text-left px-4 py-2 hover:text-primary">Feedback</button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Logout"
              >
                Logout
              </button>
            ) : (
              <a href="/auth" className="text-foreground hover:text-primary transition-colors">Log in / Sign up</a>
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
              {/* Practice */}
              <div className="px-4">
                <div className="text-sm uppercase text-muted-foreground mb-2">Practice</div>
                <div className="space-y-1">
                  <button onClick={() => { onSectionChange('ai-practice'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">AI Practice</button>
                  <button onClick={() => { onSectionChange('global-practice'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Global Practice</button>
                  <button onClick={() => { onSectionChange('rankings'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Rankings</button>
                </div>
              </div>

              {/* Tournament */}
              <button onClick={() => { onSectionChange('tournament'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3">Tournament</button>

              {/* Resource */}
              <div className="px-4">
                <div className="text-sm uppercase text-muted-foreground mb-2">Resource</div>
                <div className="space-y-1">
                  <button onClick={() => { onSectionChange('content'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Posts & Podcasts</button>
                  <button onClick={() => { onSectionChange('global-news'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Global News</button>
                  <button onClick={() => { onSectionChange('debate-guide'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Debate Guide</button>
                </div>
              </div>

              {/* My Debate */}
              <div className="px-4">
                <div className="text-sm uppercase text-muted-foreground mb-2">My Debate</div>
                <div className="space-y-1">
                  <button onClick={() => { onSectionChange('my-progress'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">My Progress</button>
                  <button onClick={() => { onSectionChange('join-us'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Join Us</button>
                  <button onClick={() => { onSectionChange('feedback'); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2">Feedback</button>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              ) : (
                <a href="/auth" className="block w-full text-left px-4 py-3">Log in / Sign up</a>
              )}
            </div>
          )}
      </div>
    </nav>
  );
};
