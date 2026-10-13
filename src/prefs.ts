import { getPreferenceValues } from "@vicinae/api";

interface extensionPrefs {
    "api-url": string;
    "api-user": string;
    "api-password": string;
};

export const prefs = getPreferenceValues<extensionPrefs>();