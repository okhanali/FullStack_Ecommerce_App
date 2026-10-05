export interface Coordinates {
  lat: number;
  lng: number;
}

const cityCoordinates: Record<string, Coordinates> = {
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  bursa: { lat: 40.1885, lng: 29.061 },
  antalya: { lat: 36.8969, lng: 30.7133 },
  adana: { lat: 36.9914, lng: 35.3308 },
  konya: { lat: 37.8746, lng: 32.4932 },
};

export const getDemoDeliveryRoute = (city: string) => {
  const destination =
    cityCoordinates[city.trim().toLocaleLowerCase("tr-TR")] ??
    cityCoordinates.istanbul!;
  const start = {
    lat: destination.lat + 0.025,
    lng: destination.lng - 0.03,
  };

  return { start, destination };
};

export const getRoutePosition = (
  start: Coordinates,
  destination: Coordinates,
  progress: number,
): Coordinates => ({
  lat: start.lat + (destination.lat - start.lat) * progress,
  lng: start.lng + (destination.lng - start.lng) * progress,
});
