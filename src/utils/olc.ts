/**
 * Shared OpenLocationCode instance.
 *
 * The `open-location-code` npm package (v1.0.3) exports a constructor —
 * all methods live on the prototype, NOT as static functions.
 * This module creates a single instance so every consumer can simply call
 *   `import { olc } from '@/utils/olc';`
 *   `olc.encode(lat, lng);`
 */
import { OpenLocationCode } from 'open-location-code';

export const olc = new OpenLocationCode();
