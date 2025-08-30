
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
              <p className="text-sm text-muted-foreground mb-3">
                Julie is dedicated to creating a community where debate lovers can connect and grow together. With a strong interest in computer science, she combines her curiosity with creativity. Inspired by both her academic passions and her love for debate, she came up with the idea of developing this website as a space for like-minded students to share, learn, and inspire one another.
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>President of Oxymorona Debate Club</li>
                <li>3 years debate experience</li>
                <li>Joined multiple international tournaments including Papillon WSDC, Transpacific WSDC</li>
                <li>Won gold speaker award in East Asia WSDC</li>
                <li>Have judged Public Forum rounds</li>
              </ul>
            </article>

            <article className="p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover-scale transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <img src="/lovable-uploads/e8c7daf1-e0a4-4f0b-b245-6b3ee9a50666.png" alt="Lina Lu profile photo" className="w-16 h-16 rounded-full border border-border object-cover" loading="lazy" />
                <div>
                  <h3 className="text-lg font-medium">Lina Lu</h3>
                  <p className="text-muted-foreground text-sm">Vice President</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Lina is a passionate debater and a dedicated tennis athlete. Whether in the debate room or on the court, she brings focus, energy, and commitment to everything she does.
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Vice president of Oxymorona Debate Club</li>
                <li>2 years debate experience in PF</li>
                <li>NHSDLC 2024 PF Offline High School best speaker award</li>
                <li>NHSDLC 2024 PF Offline Middle School Round of 16</li>
                <li>NHSDLC 2025 PF Online HIGH School QuarterFinals</li>
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
