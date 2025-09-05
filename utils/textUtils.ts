
// Regex to find dates in text like "bis 31.12", "until 1. March", "to 31.12.2025"
// It captures day, month (name or number), and optionally year.
const dateRegex = /(?:bis|until|to|-|befristet bis)\s+(?<day>\d{1,2})\.\s*(?:(?<monthNum>\d{1,2})|(?<monthName>[a-zA-Zäöü]+))\s*\.?(?:\s*(?<year>\d{2,4}))?/gi;

// Mapping month names (German/English) to month numbers (0-indexed)
const monthMap: { [key: string]: number } = {
    januar: 0, january: 0, jan: 0,
    februar: 1, february: 1, feb: 1,
    märz: 2, march: 2, mar: 2, maerz: 2,
    april: 3, apr: 3,
    mai: 4, may: 4,
    juni: 5, june: 5, jun: 5,
    juli: 6, july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8,
    oktober: 9, october: 9, oct: 9,
    november: 10, nov: 10,
    dezember: 11, december: 11, dec: 11,
};

/**
 * Parses text to find mentions of an end date and determines if it indicates a temporary rental.
 * A rental is considered temporary if the end date is within one year from today.
 * @param text - The text to search for a date.
 * @returns True if a date indicating a temporary rental is found, false otherwise.
 */
export const isTemporaryBasedOnText = (text: string): boolean => {
    if (!text) return false;

    let match;
    // Reset regex index before each use
    dateRegex.lastIndex = 0;
    while ((match = dateRegex.exec(text)) !== null) {
        const { day, monthNum, monthName, year } = match.groups!;
        
        const dayNum = parseInt(day, 10);
        let monthIndex: number | undefined;

        if (monthNum) {
            monthIndex = parseInt(monthNum, 10) - 1;
        } else if (monthName) {
            monthIndex = monthMap[monthName.toLowerCase()];
        }

        if (dayNum > 0 && monthIndex !== undefined && monthIndex >= 0 && monthIndex <= 11) {
            const now = new Date();
            let targetYear = year ? parseInt(year.length === 2 ? `20${year}` : year, 10) : now.getFullYear();
            
            const prospectiveDate = new Date(targetYear, monthIndex, dayNum);

            // If the parsed date without a year is in the past, assume it's for the next year.
            if (!year && prospectiveDate < now) {
                targetYear++;
            }

            const finalDate = new Date(targetYear, monthIndex, dayNum);
            
            // Check if the date is valid (e.g., handles Feb 30)
            if (finalDate.getDate() !== dayNum) continue;

            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            // If the end date is within the next year, it's temporary.
            if (finalDate > now && finalDate < oneYearFromNow) {
                return true;
            }
        }
    }
    return false;
};
