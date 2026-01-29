import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeatLockDocument = SeatLock & Document;

@Schema({ timestamps: { createdAt: 'lockedAt', updatedAt: false } })
export class SeatLock {
    @Prop({ type: Types.ObjectId, ref: 'Seat', required: true, unique: true })
    eventSeatId: Types.ObjectId;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ required: true })
    lockedAt: Date;

    @Prop({ required: true })
    expiresAt: Date;
}

export const SeatLockSchema = SchemaFactory.createForClass(SeatLock);

// Ensure index for automatic expiration if we want to use MongoDB's TTL,
// but the user suggested a manual Cron job or check.
// SeatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
