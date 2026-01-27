import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({
    type: { name: String, email: String, phone: String },
    _id: false,
  })
  encryptedPII!: { name: string; email: string; phone: string };

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: { loyaltyId: String, verified: Boolean },
    _id: false,
  })
  loyalty!: { loyaltyId?: string; verified: boolean };

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
    default: [],
  })
  likedEvents!: MongooseSchema.Types.ObjectId[];
}
export const CustomerSchema = SchemaFactory.createForClass(Customer);
