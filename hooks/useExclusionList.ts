// This hook is deprecated and will be removed in a future version.
// The exclusion list logic has been moved to `services/exclusionService.ts`
// to centralize state management and prepare for backend integration.

export const useExclusionList = () => {
    console.warn("`useExclusionList` is deprecated. Use `exclusionService` instead.");
    return {
        excludedProperties: [],
        addExclusion: () => {},
        removeExclusion: () => {},
    };
};
