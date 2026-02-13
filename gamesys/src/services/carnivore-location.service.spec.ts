import { Test, TestingModule } from '@nestjs/testing';
import {
  CarnivoreLocationService,
  getAllGridLocationNames,
  REDIS_CLIENT,
} from './carnivore-location.service';

describe('getAllGridLocationNames', () => {
  it('returns 416 locations (26 columns × 16 rows)', () => {
    const locations = getAllGridLocationNames();
    expect(locations).toHaveLength(26 * 16);
    expect(locations[0]).toBe('A0');
    expect(locations[15]).toBe('A15');
    expect(locations[16]).toBe('B0');
    expect(locations[locations.length - 1]).toBe('Z15');
  });

  it('covers A0 through Z15 with no duplicates', () => {
    const locations = getAllGridLocationNames();
    const set = new Set(locations);
    expect(set.size).toBe(locations.length);
    expect(locations).toContain('A0');
    expect(locations).toContain('Z15');
    expect(locations).toContain('M8');
  });
});

describe('CarnivoreLocationService', () => {
  let service: CarnivoreLocationService;
  let pipeline: { hlen: jest.Mock; exec: jest.Mock };
  let redis: { pipeline: jest.Mock };

  beforeEach(async () => {
    pipeline = {
      hlen: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    redis = {
      pipeline: jest.fn().mockReturnValue(pipeline),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarnivoreLocationService,
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<CarnivoreLocationService>(CarnivoreLocationService);
    jest.clearAllMocks();
  });

  describe('getLocationDinosaurCounts', () => {
    it('returns empty array when locationNames is empty', async () => {
      const result = await service.getLocationDinosaurCounts([]);
      expect(result).toEqual([]);
      expect(redis.pipeline).not.toHaveBeenCalled();
    });

    it('calls HLEN for each location with carnivore: prefix', async () => {
      pipeline.exec.mockResolvedValue([
        [null, 2],
        [null, 0],
      ]);

      await service.getLocationDinosaurCounts(['A5', 'B10']);

      expect(pipeline.hlen).toHaveBeenCalledWith('carnivore:A5');
      expect(pipeline.hlen).toHaveBeenCalledWith('carnivore:B10');
      expect(pipeline.hlen).toHaveBeenCalledTimes(2);
    });

    it('returns location and count for each input', async () => {
      pipeline.exec.mockResolvedValue([
        [null, 3],
        [null, 0],
        [null, 1],
      ]);

      const result = await service.getLocationDinosaurCounts([
        'A0',
        'A1',
        'B2',
      ]);

      expect(result).toEqual([
        { location: 'A0', hungryCarnivoreCount: 3 },
        { location: 'A1', hungryCarnivoreCount: 0 },
        { location: 'B2', hungryCarnivoreCount: 1 },
      ]);
    });

    it('treats pipeline error as count 0 for that location', async () => {
      pipeline.exec.mockResolvedValue([
        [null, 2],
        [new Error('Redis error'), 0],
        [null, 1],
      ]);

      const result = await service.getLocationDinosaurCounts(['X', 'Y', 'Z']);

      expect(result).toEqual([
        { location: 'X', hungryCarnivoreCount: 2 },
        { location: 'Y', hungryCarnivoreCount: 0 },
        { location: 'Z', hungryCarnivoreCount: 1 },
      ]);
    });

    it('treats non-number count as 0', async () => {
      pipeline.exec.mockResolvedValue([
        [null, 'bad'],
        [null, 5],
      ]);

      const result = await service.getLocationDinosaurCounts(['A', 'B']);

      expect(result[0].hungryCarnivoreCount).toBe(0);
      expect(result[1].hungryCarnivoreCount).toBe(5);
    });

    it('returns empty array when pipeline.exec returns null', async () => {
      pipeline.exec.mockResolvedValue(null);

      const result = await service.getLocationDinosaurCounts(['A1', 'A2']);

      expect(result).toEqual([]);
    });
  });
});
