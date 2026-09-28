import type { Dataset } from '../types';
import sampleData from './dataset.sample.json';

const jsonFiles = import.meta.glob<{ default: Dataset }>('./*.json', { eager: true });
export const dataset: Dataset = jsonFiles['./dataset.json']?.default ?? (sampleData as unknown as Dataset);
