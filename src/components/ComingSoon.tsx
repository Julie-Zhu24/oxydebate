import { ReactNode } from 'react';

interface ComingSoonProps {
  title: string;
  message?: string;
}

export const ComingSoon = ({ title, message }: ComingSoonProps) => {
  return (
    <section className="max-w-3xl mx-auto text-center py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">{message || 'This section is coming soon.'}</p>
    </section>
  );
};
