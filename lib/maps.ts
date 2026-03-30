import { Linking } from 'react-native';

/** Opens Maps in the browser / app searching for a place or route name. */
export function openRouteInMaps(placeName: string): void {
  const q = encodeURIComponent(placeName.trim());
  if (!q) return;
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
}
