import { ApiError, authorizedFetch } from './authSession';
import { parseJsonBody } from './httpJson';
import { createJobsApi } from './jobsApiCore';

export * from './jobsApiCore';

const jobsApi = createJobsApi({
  authorizedFetch,
  parseJsonBody,
  ApiError,
});

export const preflightJobUrl = jobsApi.preflightJobUrl;
export const analyzeJobUrl = jobsApi.analyzeJobUrl;
export const analyzeJobScreenshots = jobsApi.analyzeJobScreenshots;
export const fetchJobHistory = jobsApi.fetchJobHistory;
export const importJobHistory = jobsApi.importJobHistory;
export const fetchJobMetrics = jobsApi.fetchJobMetrics;
export const fetchJobAlerts = jobsApi.fetchJobAlerts;
