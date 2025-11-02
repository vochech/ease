"use client";

import { PRICING_TIERS, SubscriptionTier } from "@/lib/visibility";

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  featureName: string;
  orgSlug: string;
}

export function UpgradePrompt({
  currentTier,
  requiredTier,
  featureName,
  orgSlug,
}: UpgradePromptProps) {
  const handleUpgrade = () => {
    if (typeof window !== "undefined") {
      window.location.assign(
        `/${orgSlug}/settings/billing?upgrade=${requiredTier}`,
      );
    }
  };

  const tierInfo = PRICING_TIERS[requiredTier];

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <div className="inline-flex rounded-full bg-blue-100 p-3">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">{featureName}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Tato funkce je dostupná od <strong>{tierInfo.name}</strong> plánu.
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Aktuální plán</div>
          <div className="text-lg font-semibold text-gray-900">
            {PRICING_TIERS[currentTier].name}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {PRICING_TIERS[currentTier].price}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="h-px flex-1 bg-gray-300" />
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">Upgrade na</div>
          <div className="text-2xl font-bold text-blue-900">
            {tierInfo.name}
          </div>
          <div className="mt-1 text-lg font-semibold text-blue-700">
            {tierInfo.price}
          </div>

          <ul className="mt-3 space-y-2 text-left text-sm text-blue-900">
            {tierInfo.features.slice(0, 4).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Upgradovat na {tierInfo.name}
        </button>

        <p className="text-xs text-gray-500">
          Změnu můžeš provést kdykoliv. Můžeš také začít 14-denní zdarma
          zkušební verzí.
        </p>
      </div>
    </div>
  );
}

interface FeatureLockedBadgeProps {
  requiredTier: SubscriptionTier;
  small?: boolean;
}

export function FeatureLockedBadge({
  requiredTier,
  small = false,
}: FeatureLockedBadgeProps) {
  const tierInfo = PRICING_TIERS[requiredTier];

  if (small) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        {tierInfo.name}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm">
      <svg
        className="h-4 w-4 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-medium text-gray-700">
        Vyžaduje {tierInfo.name}
      </span>
    </div>
  );
}
