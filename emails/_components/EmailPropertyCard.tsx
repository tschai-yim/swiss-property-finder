import React from "react";
import { Property } from "../../types";
import {
  formatTravelTime,
  formatRelativeTime,
  formatDistance,
} from "../../utils/formatters";
import { calculateDistance } from "../../utils/geoUtils";
import {
  Section,
  Row,
  Column,
  Img,
  Link,
  Text,
  Button,
} from "@react-email/components";

interface EmailPropertyCardProps {
  property: Property;
  destinationCoords: { lat: number; lng: number } | null;
  className?: string;
}

const InfoIcon: React.FC<{ icon: string; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <Text className="text-sm text-gray-600 leading-none m-0">
    {icon} {children}
  </Text>
);

const HorizontalTravelTimes: React.FC<{ property: Property }> = ({
  property,
}) => {
  const travelTimeMap = [
    { mode: "public", time: property.commuteTimes.public, icon: "🚈" },
    { mode: "bike", time: property.commuteTimes.bike, icon: "🚲" },
    { mode: "car", time: property.commuteTimes.car, icon: "🚗" },
    { mode: "walk", time: property.commuteTimes.walk, icon: "🚶" },
  ];

  return (
    <Section className="mt-2 pt-2 border-t border-solid border-gray-200">
      <Row>
        {travelTimeMap.map(({ mode, time, icon }) => (
          <Column key={mode}>
            <InfoIcon icon={icon}>{formatTravelTime(time)} </InfoIcon>
          </Column>
        ))}
      </Row>
    </Section>
  );
};

export const EmailPropertyCard: React.FC<EmailPropertyCardProps> = ({
  property,
  destinationCoords,
  className,
}) => {
  if (!property.providers || property.providers.length === 0) return null;

  const googleMapsUrl = destinationCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${property.lat},${property.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=transit`
    : null;

  const distance = destinationCoords
    ? calculateDistance(
        { lat: property.lat, lng: property.lng },
        destinationCoords
      )
    : null;

  return (
    <Section
      className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}
    >
      {property.imageUrl ? (
        <Link href={property.providers[0].url} className="block no-underline">
          <Img
            className="h-48 w-full object-cover block"
            src={property.imageUrl}
            alt="Image not available"
          />
        </Link>
      ) : (
        <Section className="h-48 w-full bg-gray-200">
          <Text className="text-3xl text-gray-400 m-0">No Image</Text>
        </Section>
      )}
      <Section className="p-3">
        <Text className="text-left text-sm font-semibold text-rose-500 m-0">
          CHF {property.price.toLocaleString()}/month
        </Text>
        <Link
          href={property.providers[0].url}
          className="text-left text-lg font-bold text-gray-900 hover:underline block no-underline h-7 overflow-hidden overflow-ellipsis"
          style={{ wordBreak: "break-word" }}
        >
          {property.title}
        </Link>
        <Text className="text-left text-sm text-gray-500 truncate m-0">
          {property.address}
        </Text>

        <Section className="pt-3">
          <Row>
            <Column>
              {property.type === "sharedFlat" ? (
                <InfoIcon icon="👥">
                  {property.roommates != null
                    ? `${property.roommates} flatmates`
                    : "-"}
                </InfoIcon>
              ) : (
                <InfoIcon icon="🚪">{property.rooms} rooms</InfoIcon>
              )}
            </Column>
            <Column>
              <InfoIcon icon="📏">
                {property.size ? `${property.size} m²` : "-"}
              </InfoIcon>
            </Column>
            <Column>
              <InfoIcon icon="📅">
                {formatRelativeTime(
                  property.createdAt ? new Date(property.createdAt) : undefined
                )}
              </InfoIcon>
            </Column>
            {distance !== null && (
              <Column>
                <InfoIcon icon="📍">{formatDistance(distance)}</InfoIcon>
              </Column>
            )}
          </Row>
        </Section>

        {destinationCoords && <HorizontalTravelTimes property={property} />}

        <Section className="mt-3">
          <Row>
            {property.providers.map((provider, index) => (
              <Column key={provider.name} className={index > 0 ? "pl-2" : ""}>
                <Button
                  href={provider.url}
                  className="text-center block bg-rose-500 text-white font-bold p-2 rounded-lg hover:bg-rose-600 text-sm"
                >
                  {provider.name}
                </Button>
              </Column>
            ))}
            {googleMapsUrl && (
              <Column className="pl-2">
                <Button
                  href={googleMapsUrl}
                  className="text-center block bg-gray-600 text-white font-bold p-2 rounded-lg hover:bg-gray-700 text-sm"
                >
                  Route
                </Button>
              </Column>
            )}
          </Row>
        </Section>
      </Section>
    </Section>
  );
};
