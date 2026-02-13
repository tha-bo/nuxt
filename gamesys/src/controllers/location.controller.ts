import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DinoRepository,
  CarnivoreLocationService,
  getAllGridLocationNames,
} from '../services';
import { LocationEntity } from '../entities';

/* eslint-disable @typescript-eslint/no-unsafe-call -- Swagger decorators */
@ApiTags('locations')
@Controller('locations')
export class LocationController {
  constructor(
    private readonly dinoRepository: DinoRepository,
    private readonly carnivoreLocationService: CarnivoreLocationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List locations status',
    description:
      'Returns all grid locations with count of hungry carnivores per location.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of locations with hungry carnivore counts.',
  })
  async getAllLocationsStatus(): Promise<
    { location: string; hungryCarnivoreCount: number }[]
  > {
    const locations = getAllGridLocationNames();
    const counts =
      await this.carnivoreLocationService.getLocationDinosaurCounts(locations);
    return counts as { location: string; hungryCarnivoreCount: number }[];
  }

  @Get('needing-maintenance')
  @ApiOperation({
    summary: 'Locations needing maintenance',
    description:
      'Returns locations that have not had maintenance within the given hours (default 720 = 30 days).',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    description: 'Hours since last maintenance (default 720).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of locations needing maintenance.',
  })
  async getLocationsNeedingMaintenance(
    @Query('hours') hours?: string,
  ): Promise<LocationEntity[]> {
    const hoursThreshold = hours ? parseInt(hours, 10) : 720; // Default 1 month
    return this.dinoRepository.getLocationsNeedingMaintenance(hoursThreshold);
  }
}
