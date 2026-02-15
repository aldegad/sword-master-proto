import { RulebookContent } from '@/components/rulebook/RulebookContent';

export const metadata = {
  title: 'Rulebook',
};

export default function RulebookPage() {
  return (
    <main className="container">
      <h1 className="page-title">룰북</h1>
      <RulebookContent />
    </main>
  );
}
