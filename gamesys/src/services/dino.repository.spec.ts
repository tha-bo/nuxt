import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DinoRepository } from './dino.repository';
import { DinosaurEntity, LocationEntity } from '../entities';

describe('DinoRepository', () => {
  let repo: DinoRepository;
  let dinosaurRepository: jest.Mocked<Repository<DinosaurEntity>>;
  let locationRepository: jest.Mocked<Repository<LocationEntity>>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const createQueryBuilder = jest.fn().mockReturnValue({ ...mockQueryBuilder });
    dinosaurRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder,
    } as unknown as jest.Mocked<Repository<DinosaurEntity>>;

    locationRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    } as unknown as jest.Mocked<Repository<LocationEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DinoRepository,
        {
          provide: getRepositoryToken(DinosaurEntity),
          useValue: dinosaurRepository,
        },
        {
          provide: getRepositoryToken(LocationEntity),
          useValue: locationRepository,
        },
      ],
    }).compile();

    repo = module.get<DinoRepository>(DinoRepository);
    jest.clearAllMocks();
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getMany.mockResolvedValue([]);
  });

  describe('findAllDinosaurs', () => {
    it('calls dinosaurRepository.find with DESC order on added_at', async () => {
      const dinos = [{ id: 1, name: 'Rex' }] as DinosaurEntity[];
      (dinosaurRepository.find as jest.Mock).mockResolvedValue(dinos);

      const result = await repo.findAllDinosaurs();

      expect(dinosaurRepository.find).toHaveBeenCalledWith({
        order: { added_at: 'DESC' },
      });
      expect(result).toBe(dinos);
    });
  });

  describe('findDinosaurs', () => {
    it('returns all dinosaurs when no filters', async () => {
      const dinos = [{ id: 1 }] as DinosaurEntity[];
      mockQueryBuilder.getMany.mockResolvedValue(dinos);

      const result = await repo.findDinosaurs({});

      expect(dinosaurRepository.createQueryBuilder).toHaveBeenCalledWith(
        'dinosaur',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'dinosaur.added_at',
        'DESC',
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toBe(dinos);
    });

    it('applies active filter when provided', async () => {
      await repo.findDinosaurs({ active: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'dinosaur.is_active = :active',
        { active: true },
      );
    });

    it('applies herbivore filter when provided', async () => {
      await repo.findDinosaurs({ herbivore: false });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'dinosaur.herbivore = :herbivore',
        { herbivore: false },
      );
    });

    it('applies hungry filter when true', async () => {
      await repo.findDinosaurs({ hungry: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('last_fed_at'),
      );
    });

    it('does not add hungry condition when hungry is false', async () => {
      await repo.findDinosaurs({ hungry: false });

      const hungryCalls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls.filter(
        (call: [string]) => call[0].includes('last_fed_at'),
      );
      expect(hungryCalls).toHaveLength(0);
    });

    it('combines multiple filters', async () => {
      await repo.findDinosaurs({
        active: true,
        herbivore: true,
        hungry: true,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('findActiveDinosaurs', () => {
    it('calls find with is_active true and order', async () => {
      const dinos = [{ id: 1, is_active: true }] as DinosaurEntity[];
      (dinosaurRepository.find as jest.Mock).mockResolvedValue(dinos);

      const result = await repo.findActiveDinosaurs();

      expect(dinosaurRepository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { added_at: 'DESC' },
      });
      expect(result).toBe(dinos);
    });
  });

  describe('findActiveHungryDinosaurs', () => {
    it('uses query builder with active and hungry conditions', async () => {
      const dinos = [{ id: 1 }] as DinosaurEntity[];
      mockQueryBuilder.getMany.mockResolvedValue(dinos);

      const result = await repo.findActiveHungryDinosaurs();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'dinosaur.is_active = :active',
        { active: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('last_fed_at'),
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'dinosaur.added_at',
        'DESC',
      );
      expect(result).toBe(dinos);
    });
  });

  describe('findDinosaurById', () => {
    it('returns dinosaur when found', async () => {
      const dino = { id: 42, name: 'Rex' } as DinosaurEntity;
      (dinosaurRepository.findOne as jest.Mock).mockResolvedValue(dino);

      const result = await repo.findDinosaurById(42);

      expect(dinosaurRepository.findOne).toHaveBeenCalledWith({
        where: { id: 42 },
      });
      expect(result).toBe(dino);
    });

    it('returns null when not found', async () => {
      (dinosaurRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repo.findDinosaurById(999);

      expect(result).toBeNull();
    });
  });

  describe('getDinosaurCount', () => {
    it('returns count of active dinosaurs', async () => {
      (dinosaurRepository.count as jest.Mock).mockResolvedValue(10);

      const result = await repo.getDinosaurCount();

      expect(dinosaurRepository.count).toHaveBeenCalledWith({
        where: { is_active: true },
      });
      expect(result).toBe(10);
    });
  });

  describe('findLocationByName', () => {
    it('returns location when found', async () => {
      const loc = {
        location: 'A5',
        park_id: 1,
      } as LocationEntity;
      (locationRepository.findOne as jest.Mock).mockResolvedValue(loc);

      const result = await repo.findLocationByName('A5', 1);

      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { location: 'A5', park_id: 1 },
      });
      expect(result).toBe(loc);
    });

    it('returns null when not found', async () => {
      (locationRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repo.findLocationByName('Z99', 1);

      expect(result).toBeNull();
    });
  });

  describe('findAllLocations', () => {
    it('filters by parkId when provided', async () => {
      const locs = [{ location: 'A0', park_id: 1 }] as LocationEntity[];
      (locationRepository.find as jest.Mock).mockResolvedValue(locs);

      await repo.findAllLocations(1);

      expect(locationRepository.find).toHaveBeenCalledWith({
        where: { park_id: 1 },
        order: { maintenance_performed: 'DESC' },
      });
    });

    it('returns all locations when parkId not provided', async () => {
      const locs = [] as LocationEntity[];
      (locationRepository.find as jest.Mock).mockResolvedValue(locs);

      await repo.findAllLocations();

      expect(locationRepository.find).toHaveBeenCalledWith({
        order: { maintenance_performed: 'DESC' },
      });
    });
  });

  describe('getLocationsNeedingMaintenance', () => {
    it('uses query builder with threshold and returns locations', async () => {
      const locBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (locationRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        locBuilder,
      );
      const locs = [{ location: 'A0', park_id: 1 }] as LocationEntity[];
      locBuilder.getMany.mockResolvedValue(locs);

      const result = await repo.getLocationsNeedingMaintenance(720);

      expect(locationRepository.createQueryBuilder).toHaveBeenCalledWith(
        'location',
      );
      expect(locBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('maintenance_performed'),
        expect.objectContaining({ threshold: expect.any(Date) }),
      );
      expect(locBuilder.orderBy).toHaveBeenCalledWith(
        'location.maintenance_performed',
        'ASC',
        'NULLS FIRST',
      );
      expect(result).toBe(locs);
    });

    it('uses default 720 when no threshold provided', async () => {
      const locBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      (locationRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        locBuilder,
      );

      await repo.getLocationsNeedingMaintenance();

      expect(locBuilder.where).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ threshold: expect.any(Date) }),
      );
    });
  });
});
