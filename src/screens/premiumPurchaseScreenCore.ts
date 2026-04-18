export type PremiumPackageToken = string | number;

export type PremiumPackageTypes<TToken extends PremiumPackageToken> = {
  ANNUAL: TToken;
  MONTHLY: TToken;
  SIX_MONTH: TToken;
  THREE_MONTH: TToken;
  TWO_MONTH: TToken;
  WEEKLY: TToken;
  LIFETIME: TToken;
  CUSTOM: TToken;
  UNKNOWN: TToken;
};

export type PremiumProductLike = {
  title: string;
  priceString: string;
  pricePerMonthString?: string | null;
};

export type PremiumPackageLike<TToken extends PremiumPackageToken> = {
  identifier: string;
  packageType: TToken;
  product: PremiumProductLike;
};

export type PremiumPlan<TPackage> = {
  id: string;
  title: string;
  price: string;
  suffix?: string;
  badge?: string;
  sublabel?: string;
  package: TPackage;
};

export type PremiumPreviewSegment = {
  label: string;
  value: number;
  color: string;
};

export type NormalizedPremiumPreviewSegment = PremiumPreviewSegment & {
  percentage: number;
};

function normalizeSegmentValue(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function normalizePreviewSegments(
  segments: PremiumPreviewSegment[]
): NormalizedPremiumPreviewSegment[] {
  const cleaned = segments.map((segment) => ({
    ...segment,
    value: normalizeSegmentValue(segment.value),
  }));
  const total = cleaned.reduce((sum, segment) => sum + segment.value, 0);

  if (total <= 0) {
    return cleaned.map((segment) => ({
      ...segment,
      percentage: 0,
    }));
  }

  return cleaned.map((segment) => ({
    ...segment,
    percentage: Math.round((segment.value / total) * 100),
  }));
}

export function packagePriority<TToken extends PremiumPackageToken>(
  packageType: TToken,
  packageOrder: readonly TToken[]
) {
  const index = packageOrder.indexOf(packageType);
  return index === -1 ? packageOrder.length + 1 : index;
}

export function mapPackageToPlan<TToken extends PremiumPackageToken, TPackage extends PremiumPackageLike<TToken>>(
  pkg: TPackage,
  packageTypes: PremiumPackageTypes<TToken>
): PremiumPlan<TPackage> {
  let title = pkg.product.title;
  let price = pkg.product.priceString;
  let suffix: string | undefined;
  let badge: string | undefined;
  let sublabel: string | undefined;

  switch (pkg.packageType) {
    case packageTypes.ANNUAL:
      title = 'Yearly';
      if (pkg.product.pricePerMonthString) {
        price = pkg.product.pricePerMonthString;
        suffix = '/mo';
      }
      badge = 'MOST POPULAR';
      sublabel = `${pkg.product.priceString} billed yearly`;
      break;
    case packageTypes.MONTHLY:
      title = 'Monthly';
      suffix = '/mo';
      break;
    case packageTypes.SIX_MONTH:
      title = '6 Months';
      suffix = '/mo';
      if (pkg.product.pricePerMonthString) {
        price = pkg.product.pricePerMonthString;
      }
      break;
    case packageTypes.THREE_MONTH:
      title = '3 Months';
      suffix = '/mo';
      if (pkg.product.pricePerMonthString) {
        price = pkg.product.pricePerMonthString;
      }
      break;
    case packageTypes.TWO_MONTH:
      title = '2 Months';
      suffix = '/mo';
      if (pkg.product.pricePerMonthString) {
        price = pkg.product.pricePerMonthString;
      }
      break;
    case packageTypes.WEEKLY:
      title = 'Weekly';
      suffix = '/wk';
      break;
    case packageTypes.LIFETIME:
      title = 'Lifetime';
      suffix = '';
      break;
    default:
      title = pkg.product.title || pkg.identifier;
      break;
  }

  return {
    id: pkg.identifier,
    title,
    price,
    suffix,
    badge,
    sublabel,
    package: pkg,
  };
}

export function sortPackages<TToken extends PremiumPackageToken, TPackage extends PremiumPackageLike<TToken>>(
  packages: TPackage[],
  packageOrder: readonly TToken[]
) {
  return [...packages].sort((left, right) => {
    const byType = packagePriority(left.packageType, packageOrder) - packagePriority(right.packageType, packageOrder);
    if (byType !== 0) return byType;
    return left.identifier.localeCompare(right.identifier);
  });
}
