import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const CARNIVORE_KEY_PREFIX = 'carnivore:';

const COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ROWS = 16; // 0..15

/** All location names from A0 to Z15 (26 × 16 = 416 locations). */
export function getAllGridLocationNames(): string[] {
  const locations: string[] = [];
  for (let c = 0; c < COLUMNS.length; c++) {
    for (let r = 0; r < ROWS; r++) {
      locations.push(COLUMNS[c] + r);
    }
  }
  return locations;
}

@Injectable()
export class CarnivoreLocationService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  /**
   * For each location, gets Redis hash carnivore:{location} size (HLEN).
   * Returns all locations with their hungry carnivore count (number of entries in the hash).
   */
  async getLocationDinosaurCounts(
    locationNames: string[],
  ): Promise<{ location: string; hungryCarnivoreCount: number }[]> {
    if (locationNames.length === 0) return [];

    const pipeline = this.redis.pipeline();
    for (const name of locationNames) {
      pipeline.hlen(`${CARNIVORE_KEY_PREFIX}${name}`);
    }
    const results = await pipeline.exec();
    const out: { location: string; hungryCarnivoreCount: number }[] = [];
    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [err, count] = results[i];
        const name = locationNames[i];
        const n =
          !err && typeof count === 'number' && name !== undefined ? count : 0;
        out.push({ location: name ?? '', hungryCarnivoreCount: n });
      }
    }
    return out;
  }
}
