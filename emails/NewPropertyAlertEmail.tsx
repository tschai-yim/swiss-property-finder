import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Tailwind,
  pixelBasedPreset,
  Font,
} from "@react-email/components";
import { ResponsiveRow, ResponsiveColumn } from "@responsive-email/react-email";
import { Property, SearchMetadata } from "../types";
import { EmailPropertyCard } from "./_components/EmailPropertyCard";
import previewProps from "./NewPropertyAlertEmail.json";

interface NewPropertyAlertEmailProps {
  properties: Property[];
  metadata: Partial<SearchMetadata>;
  daysCutoff: number;
}

const PROPERTY_PER_ROWS = 2;

export const NewPropertyAlertEmail: React.FC<NewPropertyAlertEmailProps> & {
  PreviewProps: typeof previewProps;
} = ({ properties, metadata, daysCutoff }) => {
  const hasProperties = properties && properties.length > 0;
  const noResultsText = "No new properties found for this period.";
  const resultsText = `We found ${properties.length} new properties that match your search criteria from the last ${daysCutoff} day(s).`;
  const bodyText = hasProperties ? resultsText : noResultsText;
  const propertyRows = Array.from(
    { length: Math.ceil(properties.length / PROPERTY_PER_ROWS) },
    (_, i) => properties.slice(i * 2, i * 2 + PROPERTY_PER_ROWS)
  );

  return (
    <Html>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head>
          <title>New Property Alert</title>
          <Font
            fontFamily="system-ui"
            fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          />
        </Head>
        <Body>
          <Container
            className="mx-auto p-6 bg-gray-100"
            style={{ maxWidth: "750px", width: "100%" }}
          >
            <Heading className="text-2xl font-bold text-gray-800 mb-2">
              New Property Alert!
            </Heading>
            <Text className="text-gray-600 mb-6">{bodyText}</Text>

            {hasProperties && (
              <Section>
                {propertyRows.map((row, rowIndex) => (
                  <ResponsiveRow key={`row-${rowIndex}`} maxWidth={700}>
                    {/* Always create all columns to prevent different proportions on half-empty rows. */}
                    {Array.from(
                      { length: PROPERTY_PER_ROWS },
                      (_, i) => row[i]
                    ).map((property, colIndex) => (
                      <ResponsiveColumn
                        key={colIndex}
                        className={property && "p-2"}
                        // Required to make card fill the column width
                        tdProps={{ style: { width: "9999px" } }}
                      >
                        {property && (
                          <EmailPropertyCard
                            property={property}
                            destinationCoords={
                              metadata.destinationCoords || null
                            }
                            className="w-full"
                          />
                        )}
                      </ResponsiveColumn>
                    ))}
                  </ResponsiveRow>
                ))}
              </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

NewPropertyAlertEmail.PreviewProps = previewProps;

export default NewPropertyAlertEmail;
