import {Linking, Platform} from 'react-native';

// Opens the device's own maps app for real turn-by-turn navigation — an
// in-app route preview (AppMap) has no spoken directions or live
// re-routing, so "navigate"/"directions" actions hand off to Google Maps
// (Android) / Apple Maps (iOS) rather than trying to reimplement that.
export function openNativeNavigation(destination) {
  const {latitude, longitude} = destination;
  const url = Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;

  return Linking.canOpenURL(url)
    .then(supported => Linking.openURL(supported ? url : fallbackUrl))
    .catch(() => Linking.openURL(fallbackUrl));
}
