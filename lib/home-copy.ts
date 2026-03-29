/** Rotating, human-sounding lines for the home screen — stable for the day. */
function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
}

const WHISPERS = [
  'Slow miles still count.',
  'Rest days are part of the plan too.',
  'Comparison is boring — your route is yours.',
  'Coffee first, then miles. Or the other way around.',
  'Nobody’s watching your pace but you.',
  'Show up messy. Finish proud.',
];

const HEADER_LINES = [
  'Lace up, scroll down',
  'What your crew’s been up to',
  'Real runs, real people',
  'The pavement’s been busy',
  'Stories from the road',
  'Miles worth sharing',
  'Your running world, in one scroll',
];

/** Short tips for the horizontal “pulse” strip on Home. */
export const HOME_PULSE_TIPS: { icon: 'sparkles-outline' | 'water-outline' | 'heart-outline' | 'map-outline'; text: string }[] = [
  { icon: 'sparkles-outline', text: 'Consistency beats intensity most days' },
  { icon: 'water-outline', text: 'Hydrate before you debate the pace' },
  { icon: 'heart-outline', text: 'Easy miles build your engine quietly' },
  { icon: 'map-outline', text: 'New route, same you — explore a block' },
  { icon: 'sparkles-outline', text: 'Recovery is when you get stronger' },
  { icon: 'heart-outline', text: 'Show up — the rest figures itself out' },
];

export function pickPulseTips(): typeof HOME_PULSE_TIPS {
  const seed = daySeed();
  const out: typeof HOME_PULSE_TIPS = [];
  for (let i = 0; i < 4; i++) {
    out.push(HOME_PULSE_TIPS[(seed + i) % HOME_PULSE_TIPS.length]);
  }
  return out;
}

export function getFeedModeLabel(mode: 'foryou' | 'following'): { eyebrow: string; title: string } {
  if (mode === 'following') {
    return {
      eyebrow: 'Your crew',
      title: 'Runs from people you follow — chronological, no mystery algorithm.',
    };
  }
  return {
    eyebrow: 'Discover',
    title: 'The whole community — fresh faces, big races, and casual jogs.',
  };
}

export type HomeHeroCopy = {
  headline: string;
  sub: string;
  whisper: string;
};

export function pickHeaderTagline(): string {
  return HEADER_LINES[daySeed() % HEADER_LINES.length];
}

export function getHomeHeroCopy(isLoggedIn: boolean, firstName: string): HomeHeroCopy {
  const seed = daySeed();
  const h = new Date().getHours();
  const whisper = WHISPERS[seed % WHISPERS.length];

  if (isLoggedIn && firstName) {
    const morning = ['Morning', 'Hey', 'Rise and shine', 'Up already'];
    const midday = ['Hey', 'Hi', 'Afternoon', 'Still going strong'];
    const evening = ['Evening', 'Hey', 'Wind-down time', 'Almost there'];
    const pool = h < 12 ? morning : h < 17 ? midday : evening;
    const opener = pool[seed % pool.length];
    return {
      headline: `${opener}, ${firstName}`,
      sub: 'Catch up on what the community logged — PRs, easy miles, rainy sloggers, and the occasional “never again” race.',
      whisper,
    };
  }

  const guestHead =
    h < 12
      ? 'Morning — ready when you are'
      : h < 17
        ? 'Hey there, runner'
        : 'Evening — stretch those legs';

  return {
    headline: guestHead,
    sub: 'Scroll the feed, peek at routes, and when you sign in on Profile, your stats and posts live here too.',
    whisper,
  };
}

export function heroTimeIcon(): 'sunny-outline' | 'partly-sunny-outline' | 'moon-outline' {
  const h = new Date().getHours();
  if (h < 12) return 'sunny-outline';
  if (h < 18) return 'partly-sunny-outline';
  return 'moon-outline';
}
