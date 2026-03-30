/** Extra copy for public profile headers (activities still come from the live feed). */
export const USER_BIO_BY_USERNAME: Record<
  string,
  { bio: string; location?: string }
> = {
  sarah_runs: {
    bio: '10K grad · chasing sunsets and slightly unrealistic pace goals.',
    location: 'New York, NY',
  },
  mike_runner: {
    bio: 'Trail coffee enthusiast. If it’s muddy, I’m interested.',
    location: 'Portland, OR',
  },
  emma_fit: {
    bio: 'Beach miles & early alarms. Recovery snack expert.',
    location: 'San Diego, CA',
  },
  nico_trails: {
    bio: 'Tempo nerd · hills pay rent.',
    location: 'Austin, TX',
  },
  alex_runs_2024: {
    bio: 'Marathon runner | Trail enthusiast | Coffee addict.',
    location: 'San Francisco, CA',
  },
  jordan_runs: {
    bio: '5K obsessive · weekend long runs.',
    location: 'Los Angeles, CA',
  },
};
