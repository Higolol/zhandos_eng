import type { Dataset } from '../types';
import datasetJson from './dataset.json';

export const dataset: Dataset = datasetJson as unknown as Dataset;
