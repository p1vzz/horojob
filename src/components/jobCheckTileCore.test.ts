import assert from 'node:assert/strict';
import test from 'node:test';
import { JOB_CHECK_SUPPORTED_SERVICES, JOB_CHECK_TILE_COPY } from './jobCheckTileCore';

test('job check tile core lists the currently supported job services', () => {
  assert.equal(JOB_CHECK_TILE_COPY.servicesLabel, 'Supported services');
  assert.deepEqual(
    JOB_CHECK_SUPPORTED_SERVICES.map((service) => service.label),
    ['LinkedIn', 'Wellfound', 'ZipRecruiter', 'Indeed', 'Glassdoor']
  );
});
