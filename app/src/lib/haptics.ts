// [UX-2] Centralized haptic feedback
import * as Haptics from 'expo-haptics';

/** Light tap — for button presses, toggles */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — for important actions (like, save, validate) */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success — for completed actions (trail validated, badge earned) */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Error — for failed actions */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Selection changed — for picker, toggle, tab switch */
export function hapticSelection() {
  Haptics.selectionAsync().catch(() => {});
}
