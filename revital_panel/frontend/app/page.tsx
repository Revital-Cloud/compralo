import { HomeContent } from '@/components/home-content';

/**
 * Root path /: render home. Locale comes from root layout (cookie/header).
 * URL stays as / (no /en or /es). Locale is switched via header button.
 */
export default function RootPage() {
  return <HomeContent />;
}
