import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootTabParamList } from '@/navigation/types';

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

/**
 * Navigate from anywhere (outside React components).
 * Safe: no-ops if the navigator is not yet mounted.
 */
export function navigate<T extends keyof RootTabParamList>(
  screen: T,
  params?: RootTabParamList[T],
) {
  if (navigationRef.isReady()) {
    // @ts-expect-error — nested navigators make the type union messy
    navigationRef.navigate(screen, params);
  }
}
