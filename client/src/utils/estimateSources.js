export const ESTIMATE_SOURCE_CONFIGS = [
  {
    providerKey: 'zillow',
    estimateKey: 'zillowEstimate',
    name: 'Zillow'
  },
  {
    providerKey: 'redfin',
    estimateKey: 'redfinEstimate',
    name: 'Redfin'
  },
  {
    providerKey: 'realtor',
    estimateKey: 'realtorEstimate',
    name: 'Realtor'
  },
  {
    providerKey: 'homes',
    estimateKey: 'homesEstimate',
    name: 'Homes.com'
  },
  {
    providerKey: 'attom',
    estimateKey: 'attomEstimate',
    name: 'ATTOM'
  },
  {
    providerKey: 'rentcast',
    estimateKey: 'rentcastEstimate',
    name: 'RentCast'
  }
];

export function sourceStatusForProvider(provider) {
  if (!provider) {
    return 'Checked';
  }

  if (provider.skipped) {
    return 'Ready to connect';
  }

  if (typeof provider.value === 'number' && provider.value > 0) {
    return 'Included';
  }

  return 'Checked';
}

export function buildSourceStatuses(apiResponse = {}) {
  const providers = apiResponse.providers || {};

  return ESTIMATE_SOURCE_CONFIGS.map(source => ({
    ...source,
    status: sourceStatusForProvider(providers[source.providerKey])
  }));
}
