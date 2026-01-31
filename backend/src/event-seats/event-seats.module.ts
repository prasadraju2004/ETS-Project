import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSeatsService } from './event-seats.service';
import { EventSeatsController } from './event-seats.controller';
import { Seat, SeatSchema } from './event-seats.schema';
import { Event, EventSchema } from '../events/events.schema';
import { Venue, VenueSchema } from '../venue/venue.schema';
import { Ticket, TicketSchema } from '../tickets/tickets.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seat.name, schema: SeatSchema },
      { name: Event.name, schema: EventSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
    EventsModule,
  ],
  providers: [EventSeatsService],
  controllers: [EventSeatsController],
  exports: [EventSeatsService],
})
export class EventSeatsModule {}
