import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Section } from './Layout';

import aiPracticeImg from '@/assets/section-ai-practice.jpg';
import globalPracticeImg from '@/assets/section-global-practice.jpg';
import rankingsImg from '@/assets/section-rankings.jpg';
import tournamentImg from '@/assets/section-tournament.jpg';
import postsImg from '@/assets/section-posts.jpg';
import newsImg from '@/assets/section-news.jpg';
import guideImg from '@/assets/section-guide.jpg';
import mydebateImg from '@/assets/section-mydebate.jpg';
import aiHeroImg from '@/assets/section-ai-hero.jpg';
import resourceImg from '@/assets/section-resource.jpg';

interface SectionItem {
  id: Section;
  title: string;
  description: string;
  image: string;
}

interface SectionHomeProps {
  title: string;
  subtitle: string;
  heroImage: string;
  items: SectionItem[];
  onNavigate: (section: Section) => void;
}

const SectionHome = ({ title, subtitle, heroImage, items, onNavigate }: SectionHomeProps) => {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-16">
        <img src={heroImage} alt={title} className="w-full h-64 md:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">{subtitle}</p>
        </div>
      </div>

      {/* Alternating sections */}
      <div className="space-y-20">
        {items.map((item, index) => {
          const isReversed = index % 2 === 1;
          return (
            <div
              key={item.id}
              className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
            >
              <div className="md:w-1/2 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-56 md:h-72 object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-2xl md:text-3xl font-semibold">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                <Button onClick={() => onNavigate(item.id)} className="gap-2">
                  Enter {item.title} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Pre-configured section home pages ─── */

export const PracticeHome = ({ onNavigate }: { onNavigate: (s: Section) => void }) => (
  <SectionHome
    title="Practice"
    subtitle="Sharpen your debate skills with AI-powered drills and real opponents from around the world."
    heroImage={aiHeroImg}
    items={[
      {
        id: 'ai-practice',
        title: 'AI Practice',
        description: 'Train with our AI debate coach. Get instant feedback on your arguments, rebuttals, and speaking structure. Perfect for solo practice sessions anytime.',
        image: aiPracticeImg,
      },
      {
        id: 'global-practice',
        title: 'Global Practice',
        description: 'Match with real debaters from around the world. Join live practice rooms, challenge opponents, and improve through authentic debate experience.',
        image: globalPracticeImg,
      },
      {
        id: 'rankings',
        title: 'Rankings',
        description: 'See where you stand among the global community. Track your rating, win streaks, and climb the leaderboard as you improve.',
        image: rankingsImg,
      },
    ]}
    onNavigate={onNavigate}
  />
);

export const TournamentHome = ({ onNavigate }: { onNavigate: (s: Section) => void }) => (
  <SectionHome
    title="Tournament"
    subtitle="Compete in organized tournaments, track team standings, and earn recognition."
    heroImage={tournamentImg}
    items={[
      {
        id: 'tournament',
        title: 'Tournament Hub',
        description: 'Register your team, view brackets, check round results, and stay updated with tournament announcements. Everything you need in one place.',
        image: tournamentImg,
      },
    ]}
    onNavigate={onNavigate}
  />
);

export const ResourceHome = ({ onNavigate }: { onNavigate: (s: Section) => void }) => (
  <SectionHome
    title="Resources"
    subtitle="Level up your knowledge with community content, global news, and expert debate guides."
    heroImage={resourceImg}
    items={[
      {
        id: 'content',
        title: 'Posts & Podcasts',
        description: 'Read insightful articles, listen to debate podcasts, and share your own content with the community. A space for ideas and discussion.',
        image: postsImg,
      },
      {
        id: 'global-news',
        title: 'Global News',
        description: 'Stay informed with the latest debate events, competitions, and developments from around the world. Never miss an important update.',
        image: newsImg,
      },
      {
        id: 'debate-guide',
        title: 'Debate Guide',
        description: 'Learn debate fundamentals, advanced strategies, and format-specific tips through our comprehensive guide library.',
        image: guideImg,
      },
    ]}
    onNavigate={onNavigate}
  />
);

export const MyDebateHome = ({ onNavigate }: { onNavigate: (s: Section) => void }) => (
  <SectionHome
    title="My Debate"
    subtitle="Track your journey, join the team, and share your feedback."
    heroImage={mydebateImg}
    items={[
      {
        id: 'my-progress',
        title: 'My Progress',
        description: 'View your practice history, session stats, scores, and improvement over time. A personal dashboard for your debate journey.',
        image: mydebateImg,
      },
      {
        id: 'join-us',
        title: 'Join Us',
        description: 'Interested in becoming part of the Oxymorona team? Apply as a debater, judge, or contributor and help grow the community.',
        image: resourceImg,
      },
      {
        id: 'feedback',
        title: 'Feedback',
        description: 'Help us improve! Share your thoughts, report issues, or suggest new features. Your voice shapes the future of this platform.',
        image: aiPracticeImg,
      },
    ]}
    onNavigate={onNavigate}
  />
);
