import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EventSeatDocument = EventSeat & Document;

@Schema({ timestamps: true })
export class EventSeat {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  event_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  seat_id: string; // matches Venue.seats.s_id

  @Prop({
    type: Number,
    required: true,
    index: true,
  })
  status: number; // 0=available, 1=locked, 2=booked

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: Date,
    default: null,
  })
  locked_until: Date;
}

export const EventSeatSchema = SchemaFactory.createForClass(EventSeat);
