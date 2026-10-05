import { useEffect } from "react";
import { divIcon } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryMapProps {
  city: string;
  courierLocation?: { lat: number; lng: number };
}

type LatLng = [number, number];

const cityCoordinates: Record<string, LatLng> = {
  istanbul: [41.0082, 28.9784],
  ankara: [39.9334, 32.8597],
  izmir: [38.4237, 27.1428],
  bursa: [40.1885, 29.061],
  antalya: [36.8969, 30.7133],
  adana: [36.9914, 35.3308],
  konya: [37.8746, 32.4932],
};

const RecenterMap = ({ point }: { point: LatLng }) => {
  const map = useMap();
  const latitude = point[0];
  const longitude = point[1];
  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 12), {
      duration: 0.8,
    });
  }, [map, latitude, longitude]);
  return null;
};

export const DeliveryMap = ({ city, courierLocation }: DeliveryMapProps) => {
  const destination =
    cityCoordinates[city.trim().toLocaleLowerCase("tr-TR")] ??
    cityCoordinates.istanbul!;
  const courier: LatLng = courierLocation
    ? [courierLocation.lat, courierLocation.lng]
    : [destination[0] + 0.025, destination[1] - 0.03];
  const courierIcon = divIcon({
    className: "courier-map-icon",
    html: '<span class="courier-map-pulse"><span></span></span>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  return (
    <div className="h-85 overflow-hidden rounded-lg border border-gray-200 sm:h-105">
      <MapContainer
        center={courier}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <RecenterMap point={courier} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={[courier, destination]}
          pathOptions={{
            color: "#285c46",
            weight: 4,
            opacity: 0.75,
            dashArray: "8 8",
          }}
        />
        <CircleMarker
          center={destination}
          radius={9}
          pathOptions={{
            color: "#1d2823",
            fillColor: "#d0f271",
            fillOpacity: 1,
            weight: 3,
          }}
        />
        {courierLocation && <Marker position={courier} icon={courierIcon} />}
      </MapContainer>
    </div>
  );
};
