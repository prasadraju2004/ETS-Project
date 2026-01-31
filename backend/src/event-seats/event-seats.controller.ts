import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventSeatsService } from './event-seats.service';

@Controller('event-seats')
export class EventSeatsController {
  constructor(private seatsService: EventSeatsService) {}

  @Get('event/:eventId')
  async getEventSeats(@Param('eventId') eventId: string) {
    try {
      const seats = await this.seatsService.getEventSeats(eventId);
      return {
        seats, // Matches Frontend expectation
        count: seats.length,
      };
    } catch (error) {
      console.error('Error fetching event seats:', error);
      throw new HttpException(
        error.message || 'Failed to fetch seats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('lock-seat')
  async lockSeat(@Body() body: { eventSeatId: string; userId: string }) {
    return this.seatsService.lockSeat(body.eventSeatId, body.userId);
  }

  @Post('unlock-seat')
  async unlockSeat(@Body() body: { eventSeatId: string; userId: string }) {
    return this.seatsService.unlockSeat(body.eventSeatId, body.userId);
  }

  // Called after payment success
  @Post('confirm')
  async confirmPurchase(@Body() body: { seatIds: string[]; userId: string }) {
    return this.seatsService.confirmPurchase(body.seatIds, body.userId);
  }
}
