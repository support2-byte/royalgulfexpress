import { Easing, LinearTransition } from "react-native-reanimated";

// Shared motion tokens. No springs with overshoot anywhere user-facing.
export const EASE_OUT = Easing.bezier(0.25, 1, 0.5, 1);
export const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);

/** Smooth, non-bouncy layout transition for lists and expanding cards. */
export const LAYOUT = LinearTransition.duration(260).easing(EASE_OUT);
