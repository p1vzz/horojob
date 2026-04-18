export const JOB_CHECK_TILE_COPY = {
  title: 'Job Posting Check',
  description: 'Check a role against your natal chart, then review compatibility, AI risk, and key fit signals.',
  servicesLabel: 'Supported services',
  actionLabel: 'Check a posting',
  footnote: 'Public job detail links work best.',
} as const;

export const JOB_CHECK_SUPPORTED_SERVICES = [
  {
    label: 'LinkedIn',
    detail: 'Public jobs',
  },
  {
    label: 'Wellfound',
    detail: 'Startup roles',
  },
  {
    label: 'ZipRecruiter',
    detail: 'Job pages',
  },
  {
    label: 'Indeed',
    detail: 'Job pages',
  },
  {
    label: 'Glassdoor',
    detail: 'Job listings',
  },
] as const;
