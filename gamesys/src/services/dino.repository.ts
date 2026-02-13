import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DinosaurEntity, LocationEntity } from '../entities';

@Injectable()
export class DinoRepository {
  constructor(
    @InjectRepository(DinosaurEntity)
    private readonly dinosaurRepository: Repository<DinosaurEntity>,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
  ) {}

  // Dinosaur queries
  async findAllDinosaurs(): Promise<DinosaurEntity[]> {
    return this.dinosaurRepository.find({
      order: { added_at: 'DESC' },
    });
  }

  /** Find dinosaurs with optional filters: active, hungry, herbivore */
  async findDinosaurs(filters: {
    active?: boolean;
    hungry?: boolean;
    herbivore?: boolean;
  }): Promise<DinosaurEntity[]> {
    const qb = this.dinosaurRepository
      .createQueryBuilder('dinosaur')
      .orderBy('dinosaur.added_at', 'DESC');

    if (filters.active !== undefined) {
      qb.andWhere('dinosaur.is_active = :active', { active: filters.active });
    }
    if (filters.herbivore !== undefined) {
      qb.andWhere('dinosaur.herbivore = :herbivore', {
        herbivore: filters.herbivore,
      });
    }
    if (filters.hungry === true) {
      qb.andWhere(
        `(dinosaur.last_fed_at IS NULL OR datetime(dinosaur.last_fed_at, '+' || dinosaur.digestion_period_in_hours || ' hours') <= datetime('now'))`,
      );
    }

    return qb.getMany();
  }

  async findActiveDinosaurs(): Promise<DinosaurEntity[]> {
    return this.dinosaurRepository.find({
      where: { is_active: true },
      order: { added_at: 'DESC' },
    });
  }

  /** Active dinosaurs that are hungry: never fed or digestion period has passed since last_fed_at */
  async findActiveHungryDinosaurs(): Promise<DinosaurEntity[]> {
    return this.dinosaurRepository
      .createQueryBuilder('dinosaur')
      .where('dinosaur.is_active = :active', { active: true })
      .andWhere(
        `(dinosaur.last_fed_at IS NULL OR datetime(dinosaur.last_fed_at, '+' || dinosaur.digestion_period_in_hours || ' hours') <= datetime('now'))`,
      )
      .orderBy('dinosaur.added_at', 'DESC')
      .getMany();
  }

  async findDinosaurById(id: number): Promise<DinosaurEntity | null> {
    return this.dinosaurRepository.findOne({
      where: { id },
    });
  }

  // Statistics
  async getDinosaurCount(): Promise<number> {
    return this.dinosaurRepository.count({ where: { is_active: true } });
  }

  // Location queries
  async findLocationByName(
    location: string,
    parkId: number,
  ): Promise<LocationEntity | null> {
    return this.locationRepository.findOne({
      where: { location, park_id: parkId },
    });
  }

  async findAllLocations(parkId?: number): Promise<LocationEntity[]> {
    if (parkId) {
      return this.locationRepository.find({
        where: { park_id: parkId },
        order: { maintenance_performed: 'DESC' },
      });
    }
    return this.locationRepository.find({
      order: { maintenance_performed: 'DESC' },
    });
  }

  async getLocationsNeedingMaintenance(
    hoursThreshold: number = 720, // Default 1 month (30 days)
  ): Promise<LocationEntity[]> {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);

    return this.locationRepository
      .createQueryBuilder('location')
      .where(
        '(location.maintenance_performed IS NULL OR location.maintenance_performed < :threshold)',
        { threshold: thresholdTime },
      )
      .orderBy('location.maintenance_performed', 'ASC', 'NULLS FIRST')
      .getMany();
  }
}
