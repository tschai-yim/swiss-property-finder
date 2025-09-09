import path from 'path';
import { promises as fs } from 'fs';
import { FilterCriteria } from '../../types';

const SAVE_PATH = path.join(process.cwd(), 'data', 'latest_search.json');

const defaultFilters: FilterCriteria = {
    buckets: [
        {
            id: 'shared-default',
            type: 'sharedFlat',
            price: { min: '', max: '1000' },
            rooms: { min: '', max: '' },
            size: { min: '', max: '' },
            roommates: { min: '', max: '', },
        },
        {
            id: 'prop-1-default',
            type: 'property',
            price: { min: '', max: '1000' },
            rooms: { min: '1', max: '' },
            size: { min: '', max: '' },
            roommates: { min: '', max: '', },
        },
        {
            id: 'prop-3-default',
            type: 'property',
            price: { min: '', max: '1800' },
            rooms: { min: '3', max: '' },
            size: { min: '', max: '', },
            roommates: { min: '', max: '', },
        },
        {
            id: 'prop-4-default',
            type: 'property',
            price: { min: '', max: '2700' },
            rooms: { min: '4', max: '' },
            size: { min: '', max: '', },
            roommates: { min: '', max: '', },
        },
    ],
    destination: 'ETH Hauptgebäude (HG), Rämistrasse 101, 8092 Zurich, Switzerland', 
    maxTravelTimes: {
        public: '35',
        bike: '25',
        car: '30',
        walk: '25',
    }, 
    travelModes: ['public', 'bike'],
    exclusionKeywords: 'Tauschwohnung, Wochenaufenthalt',
    genderPreference: 'male',
    rentalDuration: 'permanent',
};


export const saveSearch = async (filters: FilterCriteria): Promise<void> => {
  await fs.writeFile(SAVE_PATH, JSON.stringify(filters, null, 2));
};

export const getLatestSearch = async (): Promise<FilterCriteria> => {
  try {
    const data = await fs.readFile(SAVE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default filters.
      return defaultFilters;
    }
    // For other errors, re-throw.
    throw error;
  }
};
