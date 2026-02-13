import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DinoRepository, CarnivoreLocationService } from './services';
import { DinosaurEntity, LocationEntity } from './entities';
import { DinosaurController, LocationController } from './controllers';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './services/carnivore-location.service';

@Module({
  imports: [TypeOrmModule.forFeature([DinosaurEntity, LocationEntity])],
  controllers: [DinosaurController, LocationController],
  providers: [
    DinoRepository,
    CarnivoreLocationService,
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis(process.env.REDIS_URL || 'redis://localhost:6379'),
    },
  ],
  exports: [DinoRepository],
})
export class DinoModule {}
