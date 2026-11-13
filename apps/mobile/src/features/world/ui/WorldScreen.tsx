import { EmptyState, ParchmentScreen, RegionBanner } from '@hylink/ui';

import { listRegionPreviews } from '../application/listRegionPreviews';

export function WorldScreen() {
  const [region] = listRegionPreviews();

  return (
    <ParchmentScreen title="World atlas" subtitle="Illustrated places stay separate from geographic data.">
      {region ? (
        <RegionBanner
          name={region.name}
          description={region.description}
          detail={`${region.discoveries} mock discoveries`}
        />
      ) : (
        <EmptyState title="No regions yet" message="Regions will appear after you confirm them." />
      )}
    </ParchmentScreen>
  );
}

