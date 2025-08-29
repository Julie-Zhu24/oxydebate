
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import type { Section } from '@/components/Layout';
import { Announcements } from '@/components/Announcements';
const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Oxymorona Debate Community';

    const descText = 'Practice, debate, and rank up with Oxymorona — a global debate community powered by AI and real sessions.';
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descText);

    const canonicalHref = window.location.origin + '/';
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);
  }, []);

  const handleGetStarted = () => {
    navigate(user ? '/app' : '/auth');
  };


  const handleNavSectionChange = (section: Section) => {
    navigate(user ? `/app?section=${section}` : '/auth');
  };
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation
        activeSection={"ai-practice" as Section}
        onSectionChange={handleNavSectionChange}
        isAuthenticated={!!user}
        onLogout={signOut}
      />
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] md:h-screen overflow-hidden">
        <img
          src="/lovable-uploads/81b3875b-f5ba-4565-873d-48077a07f163.png"
          alt="Students engaged in a debate at Oxymorona Community"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/15 to-background/50" />

        <div className="relative z-10 container mx-auto h-full px-4 lg:px-8 flex items-center">
          <div
            className="max-w-xl md:max-w-2xl p-6 md:p-10 bg-card/40 border border-border backdrop-blur-md shadow-lg"
            style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}
          >
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Oxymorona Debate Community
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6">
              Where conviction meets curiosity. Train with AI, spar with real opponents, and climb the global rankings. Debate smarter. Win fairer. Grow together.
            </p>
            <Button size="lg" onClick={handleGetStarted} aria-label="Get started">
              Get started
            </Button>
          </div>
        </div>
      </section>

      <main>
        <Announcements />

        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">Meet our team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover-scale transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <img src="/lovable-uploads/f5512394-e22b-40b2-9af4-2aa55972453d.png" alt="Julie Zhu profile photo" className="w-16 h-16 rounded-full border border-border object-cover" loading="lazy" />
                <div>
                  <h3 className="text-lg font-medium">Julie Zhu</h3>
                  <p className="text-muted-foreground text-sm">Website Developer</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Julie is dedicated to creating a community where debate lovers can connect and grow together. With a strong interest in computer science, she combines her curiosity with creativity. Inspired by both her academic passions and her love for debate, she came up with the idea of developing this website as a space for like-minded students to share, learn, and inspire one another.
              </p>
            </article>

            <article className="p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover-scale transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <img src="/public/placeholder.svg" alt="Developer avatar placeholder" className="w-16 h-16 rounded-full border border-border" loading="lazy" />
                <div>
                  <h3 className="text-lg font-medium">Jordan Lee</h3>
                  <p className="text-muted-foreground text-sm">Backend & Infra</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Focused on reliable systems and real‑time features. Enjoys databases, security, and making everything just work.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
