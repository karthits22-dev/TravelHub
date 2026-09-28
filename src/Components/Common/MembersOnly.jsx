import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';

import {useMembership, isMemberActive} from '../../Services/MembershipService';

const CREAM = '#F5F0E4';

// Browsing is open to everyone — only *starting* an action (a booking, an
// insurance/renewal) needs an active AMC membership. Two ways to guard one:

// 1. Actions that happen inside a screen (Book now, Book ride). Returns
//    true when the action may go ahead; otherwise opens ActivateMembership,
//    which goes back to this same screen (selections intact) once paid.
export function requireMembership(navigation) {
  if (isMemberActive()) return true;
  navigation?.navigate?.('ActivateMembership');
  return false;
}

// 2. Action screens (ConfirmPay, RenewalForm). Wrap where the screen is
//    registered (App.jsx) so every way of reaching it is covered. A
//    non-member's route is *replaced* by ActivateMembership (carrying
//    `redirectTo`), so Back returns to where they were browsing, and a
//    successful activation replaces it again with this screen.
//    Must be called at module level, never inside render, so each wrapped
//    screen keeps a stable component type.
export function withMembersOnly(Screen) {
  const Gated = props => {
    const {navigation, route} = props;
    const membership = useMembership();
    const shouldRedirect = membership.loaded && !membership.active;

    useEffect(() => {
      if (!shouldRedirect) return;
      navigation.replace('ActivateMembership', {
        redirectTo: {name: route.name, params: route.params},
      });
    }, [shouldRedirect, navigation, route]);

    // Stored status not read yet, or mid-redirect — a blank cream frame
    // rather than flashing the wrong thing.
    if (!membership.active) return <View style={styles.screen} />;
    return <Screen {...props} />;
  };
  Gated.displayName = `MembersOnly(${Screen.displayName || Screen.name || 'Screen'})`;
  return Gated;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },
});
