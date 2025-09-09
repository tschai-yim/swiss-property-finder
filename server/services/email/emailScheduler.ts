import cron from "node-cron";
import { debugConfig, emailConfig } from "../../../utils/env";
import { getLatestSearch } from "../savedSearchService";
import { sendEmail } from "./emailService";
import { fetchNewPropertiesForEmail } from "./emailSearchService";
import { exclusionService } from "../exclusionService";
import { renderEmailTemplate } from "../../utils/renderEmail";

const getLookbackHours = (scheduleTime: string): number => {
  const now = new Date();
  const [hour, minute] = scheduleTime.split(":").map(Number);
  const scheduledTimeToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute
  );

  const scheduleTimes = emailConfig.scheduleTimes
    .map((st) => {
      const [h, m] = st.split(":").map(Number);
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  const currentScheduledTimeIndex = scheduleTimes.findIndex(
    (st) => st.getTime() === scheduledTimeToday.getTime()
  );
  const previousScheduledTime =
    scheduleTimes[currentScheduledTimeIndex - 1] ||
    scheduleTimes[scheduleTimes.length - 1];

  if (currentScheduledTimeIndex === 0) {
    // It's the first schedule of the day, so look back to yesterday's last schedule
    previousScheduledTime.setDate(previousScheduledTime.getDate() - 1);
  }

  const diffMillis =
    scheduledTimeToday.getTime() - previousScheduledTime.getTime();
  return diffMillis / (1000 * 60 * 60);
};

const performCheck = async (lookbackHours: number) => {
  console.log(
    `Performing periodic check for new properties (lookback: ${lookbackHours} hours)`
  );
  const savedSearch = await getLatestSearch();
  if (!savedSearch) {
    console.log("No saved search found, skipping check.");
    return;
  }

  if (!emailConfig.to) {
    console.log("No recipient configured, skipping email check.");
    return;
  }

  const excludedProperties = await exclusionService.getExclusions();
  const createdSince = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const { properties, metadata } = await fetchNewPropertiesForEmail(
    savedSearch,
    debugConfig,
    excludedProperties,
    createdSince,
    (message) => console.log(`[Email Search] ${message}`)
  );

  if (properties.length > 0) {
    console.log(`Found ${properties.length} new properties. Sending email.`);
    const emailHtml = await renderEmailTemplate(
      properties,
      metadata,
      lookbackHours / 24
    );
    await sendEmail(emailConfig.to, `New Properties Found`, emailHtml);
  } else {
    console.log("No new properties found.");
  }
};

export const startEmailScheduler = () => {
  if (emailConfig.debugImmediateCheck) {
    console.log(
      `Debug mode: Immediately checking for properties with a lookback of ${emailConfig.debugLookbackHours} hours.`
    );
    performCheck(emailConfig.debugLookbackHours);
  }

  emailConfig.scheduleTimes.forEach((time) => {
    const [hour, minute] = time.split(":");
    cron.schedule(
      `${minute} ${hour} * * *`,
      () => {
        const lookback = getLookbackHours(time);
        performCheck(lookback);
      },
      {
        timezone: emailConfig.scheduleTimezone,
      }
    );
    console.log(
      `Scheduled email check at ${time} (${emailConfig.scheduleTimezone})`
    );
  });
};
