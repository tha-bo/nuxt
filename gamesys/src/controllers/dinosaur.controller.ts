import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DinoRepository } from '../services';

/* eslint-disable @typescript-eslint/no-unsafe-call -- Swagger decorators */
@ApiTags('dinosaurs')
@Controller('dinosaurs')
export class DinosaurController {
  constructor(private readonly dinoRepository: DinoRepository) {}

  @Get()
  @ApiOperation({
    summary: 'List dinosaurs',
    description:
      'Returns dinosaurs with optional filters: active, hungry, herbivore (each as query param true/false).',
  })
  @ApiQuery({ name: 'active', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'hungry', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'herbivore', required: false, enum: ['true', 'false'] })
  @ApiResponse({ status: 200, description: 'List of dinosaurs.' })
  async getAll(
    @Query('active') active?: string,
    @Query('hungry') hungry?: string,
    @Query('herbivore') herbivore?: string,
  ) {
    const filters: {
      active?: boolean;
      hungry?: boolean;
      herbivore?: boolean;
    } = {};
    if (active !== undefined && active !== '') {
      filters.active = active === 'true';
    }
    if (hungry !== undefined && hungry !== '') {
      filters.hungry = hungry === 'true';
    }
    if (herbivore !== undefined && herbivore !== '') {
      filters.herbivore = herbivore === 'true';
    }
    return this.dinoRepository.findDinosaurs(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get dinosaur by ID',
    description: 'Returns a single dinosaur by id.',
  })
  @ApiResponse({ status: 200, description: 'The dinosaur.' })
  @ApiResponse({ status: 404, description: 'Dinosaur not found.' })
  async getDinosaurById(@Param('id') id: string) {
    return this.dinoRepository.findDinosaurById(parseInt(id, 10));
  }
}
