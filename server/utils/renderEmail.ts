import { NewPropertyAlertEmail } from "../../emails/NewPropertyAlertEmail";
import { Property, SearchMetadata } from "../../types";
import React from "react";
import { render } from "@react-email/components";

export const renderEmailTemplate = (
  properties: Property[],
  metadata: SearchMetadata,
  daysCutoff: number
): Promise<string> => {
  return render(
    React.createElement(NewPropertyAlertEmail, {
      properties: properties,
      metadata: metadata,
      daysCutoff: daysCutoff,
    })
  );
};
