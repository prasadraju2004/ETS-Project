import { Module } from '@nestjs/common';
import { EventSeatsController } from './event-seats.controller';
import { EventSeatsService } from './event-seats.service';

@Module({
  controllers: [EventSeatsController],
  providers: [EventSeatsService]
})
export class EventSeatsModule {}
