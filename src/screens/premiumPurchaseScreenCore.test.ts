import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapPackageToPlan,
  normalizePreviewSegments,
  packagePriority,
  sortPackages,
  type PremiumPackageTypes,
} from './premiumPurchaseScreenCore';

const PACKAGE_TYPES: PremiumPackageTypes<string> = {
  ANNUAL: 'annual',
  MONTHLY: 'monthly',
  SIX_MONTH: 'six_month',
  THREE_MONTH: 'three_month',
  TWO_MONTH: 'two_month',
  WEEKLY: 'weekly',
  LIFETIME: 'lifetime',
  CUSTOM: 'custom',
  UNKNOWN: 'unknown',
};

const PACKAGE_ORDER = [
  PACKAGE_TYPES.ANNUAL,
  PACKAGE_TYPES.MONTHLY,
  PACKAGE_TYPES.SIX_MONTH,
  PACKAGE_TYPES.THREE_MONTH,
  PACKAGE_TYPES.TWO_MONTH,
  PACKAGE_TYPES.WEEKLY,
  PACKAGE_TYPES.LIFETIME,
  PACKAGE_TYPES.CUSTOM,
  PACKAGE_TYPES.UNKNOWN,
] as const;

test('premium core calculates package priority and sorting', () => {
  assert.equal(packagePriority('monthly', PACKAGE_ORDER), 1);
  assert.equal(packagePriority('mystery', PACKAGE_ORDER), PACKAGE_ORDER.length + 1);

  const sorted = sortPackages(
    [
      {
        identifier: 'b-plan',
        packageType: 'monthly',
        product: { title: 'Monthly', priceString: '$9.99' },
      },
      {
        identifier: 'a-plan',
        packageType: 'monthly',
        product: { title: 'Monthly', priceString: '$8.99' },
      },
      {
        identifier: 'yearly',
        packageType: 'annual',
        product: { title: 'Yearly', priceString: '$59.99', pricePerMonthString: '$4.99' },
      },
    ],
    PACKAGE_ORDER
  );

  assert.deepEqual(
    sorted.map((item) => item.identifier),
    ['yearly', 'a-plan', 'b-plan']
  );
});

test('premium core maps annual, monthly, lifetime and unknown packages', () => {
  const annual = mapPackageToPlan(
    {
      identifier: 'yearly',
      packageType: 'annual',
      product: { title: 'Yearly Product', priceString: '$59.99', pricePerMonthString: '$4.99' },
    },
    PACKAGE_TYPES
  );
  assert.equal(annual.title, 'Yearly');
  assert.equal(annual.price, '$4.99');
  assert.equal(annual.suffix, '/mo');
  assert.equal(annual.badge, 'MOST POPULAR');
  assert.equal(annual.sublabel, '$59.99 billed yearly');

  const monthly = mapPackageToPlan(
    {
      identifier: 'monthly',
      packageType: 'monthly',
      product: { title: 'Monthly Product', priceString: '$9.99' },
    },
    PACKAGE_TYPES
  );
  assert.equal(monthly.title, 'Monthly');
  assert.equal(monthly.suffix, '/mo');

  const lifetime = mapPackageToPlan(
    {
      identifier: 'lifetime',
      packageType: 'lifetime',
      product: { title: 'Lifetime Product', priceString: '$199.99' },
    },
    PACKAGE_TYPES
  );
  assert.equal(lifetime.title, 'Lifetime');
  assert.equal(lifetime.suffix, '');

  const unknown = mapPackageToPlan(
    {
      identifier: 'custom-plan',
      packageType: 'mystery',
      product: { title: '', priceString: '$29.99' },
    },
    PACKAGE_TYPES
  );
  assert.equal(unknown.title, 'custom-plan');
});

test('premium core normalizes preview chart segments', () => {
  const segments = normalizePreviewSegments([
    { label: 'A', value: 2, color: '#111111' },
    { label: 'B', value: 3, color: '#222222' },
    { label: 'C', value: -10, color: '#333333' },
  ]);

  assert.deepEqual(
    segments.map((segment) => segment.percentage),
    [40, 60, 0]
  );
  assert.equal(segments[2]?.value, 0);

  assert.deepEqual(
    normalizePreviewSegments([{ label: 'Empty', value: 0, color: '#111111' }]).map(
      (segment) => segment.percentage
    ),
    [0]
  );
});
