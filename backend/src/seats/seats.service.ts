import { Injectable, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { EventGateway } from '../events/events.gateway';
import { Seat, SeatDocument, SeatStatus } from './seats.schema';
import { SeatLock, SeatLockDocument } from './seat-lock.schema';

export interface HoldSeatsDto {
  eventId: string;
  seatIds: string[];
  customerId: string;
}

export interface SeatResponse {
  _id: string;
  eventId: string;
  zoneId: string;
  row: string;
  seatNumber: string;
  status: string;
  holdExpiresAt?: Date;
  heldBy?: string;
  position?: { x: number; y: number };
  isAccessible?: boolean;
  isAisle?: boolean;
}

@Injectable()
export class SeatsService {
  constructor(
    @InjectModel('Seat') private seatModel: Model<SeatDocument>,
    @InjectModel('Event') private eventModel: Model<any>,
    @InjectModel('Venue') private venueModel: Model<any>,
    @InjectModel('Zone') private zoneModel: Model<any>,
    @InjectModel('SeatLock') private seatLockModel: Model<SeatLockDocument>,
    @InjectModel('Ticket') private ticketModel: Model<any>,
    @InjectConnection() private connection: Connection,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private eventGateway: EventGateway,
  ) { }

  /**
   * Initialize seats for an event based on venue configuration
   */
  async initializeSeatsForEvent(eventId: string, venueId: string): Promise<void> {
    try {
      const venue = await this.venueModel.findById(venueId).lean();
      if (!venue) {
        throw new BadRequestException('Venue not found');
      }

      const zones = await this.zoneModel.find({ eventId: new Types.ObjectId(eventId) }).lean();

      const seatsToCreate: any[] = [];

      for (const section of venue.sections) {
        const zone = zones.find(z => z.name === section.name || z.name.includes(section.sectionId));

        if (!zone) {
          console.warn(`No zone found for section ${section.sectionId}`);
          continue;
        }

        for (const seatConfig of section.seats) {
          seatsToCreate.push({
            eventId: new Types.ObjectId(eventId),
            zoneId: zone._id,
            row: seatConfig.row,
            seatNumber: seatConfig.seatNumber.toString(),
            status: SeatStatus.AVAILABLE,
            position: seatConfig.position,
            isAccessible: seatConfig.isAccessible || false,
            isAisle: seatConfig.isAisle || false,
          });
        }
      }

      if (seatsToCreate.length > 0) {
        await this.seatModel.insertMany(seatsToCreate);
        console.log(`Initialized ${seatsToCreate.length} seats for event ${eventId}`);
      }
    } catch (error) {
      console.error('Error initializing seats:', error);
      throw error;
    }
  }

  /**
   * Get all seats for an event
   */
  async getEventSeats(eventId: string): Promise<SeatResponse[]> {
    const seats = await this.seatModel.find({ eventId: new Types.ObjectId(eventId) }).lean();
    if (seats.length === 0) return [];

    const redisKeys = seats.map(s => `lock:event:${eventId}:seat:${s._id}`);
    const locks = await this.redis.mget(...redisKeys);

    return seats.map((seat, index) => {
      const response = this.mapSeatToResponse(seat);
      const lockedBy = locks[index];

      if (lockedBy) {
        response.status = SeatStatus.LOCKED;
        response.heldBy = lockedBy;
      } else if (seat.status === SeatStatus.LOCKED || seat.status === SeatStatus.HELD) {
        if (seat.status === SeatStatus.HELD && seat.holdExpiresAt && seat.holdExpiresAt > new Date()) {
          // Keep HELD
        } else {
          response.status = SeatStatus.AVAILABLE;
          delete response.heldBy;
        }
      }

      return response;
    });
  }

  /**
   * Get seats by zone
   */
  async getSeatsByZone(eventId: string, zoneId: string): Promise<SeatResponse[]> {
    const seats = await this.seatModel.find({
      eventId: new Types.ObjectId(eventId),
      zoneId: new Types.ObjectId(zoneId)
    }).lean();

    if (seats.length === 0) return [];

    // Fetch all locks for these seats from Redis in one go
    const redisKeys = seats.map(s => `lock:event:${eventId}:seat:${s._id}`);
    const locks = await this.redis.mget(...redisKeys);

    return seats.map((seat, index) => {
      const response = this.mapSeatToResponse(seat);
      const lockedBy = locks[index];

      if (lockedBy) {
        // If it's in Redis, it's definitely LOCKED
        response.status = SeatStatus.LOCKED;
        response.heldBy = lockedBy;
      } else if (seat.status === SeatStatus.LOCKED || seat.status === SeatStatus.HELD) {
        // If it's NOT in Redis but status is LOCKED/HELD in DB, 
        // it means the lock expired or it's a legacy hold.
        // We check holdExpiresAt for HELD.
        if (seat.status === SeatStatus.HELD && seat.holdExpiresAt && seat.holdExpiresAt > new Date()) {
          // Keep HELD if not expired
        } else {
          response.status = SeatStatus.AVAILABLE;
          delete response.heldBy;
        }
      }

      return response;
    });
  }

  /**
   * Get available seat count by zone
   */
  async getAvailableSeatsByZone(eventId: string): Promise<Record<string, number>> {
    const seats = await this.seatModel.find({ eventId: new Types.ObjectId(eventId) }).lean();
    if (seats.length === 0) return {};

    const redisKeys = seats.map(s => `lock:event:${eventId}:seat:${s._id}`);
    const locks = await this.redis.mget(...redisKeys);

    const zoneAvailability: Record<string, number> = {};

    seats.forEach((seat, index) => {
      const lockedBy = locks[index];
      let isAvailable = seat.status === SeatStatus.AVAILABLE;

      // Passive release check
      if (seat.status === SeatStatus.LOCKED && !lockedBy) {
        isAvailable = true;
      }
      if (seat.status === SeatStatus.HELD && seat.holdExpiresAt && seat.holdExpiresAt < new Date()) {
        isAvailable = true;
      }

      // If it's in Redis, it's NOT available
      if (lockedBy) {
        isAvailable = false;
      }

      if (isAvailable) {
        const zId = seat.zoneId.toString();
        zoneAvailability[zId] = (zoneAvailability[zId] || 0) + 1;
      }
    });

    return zoneAvailability;
  }

  /**
   * Get seat by ID
   */
  async getSeatById(seatId: string): Promise<SeatResponse | null> {
    const seat = await this.seatModel.findById(seatId).lean();
    return seat ? this.mapSeatToResponse(seat) : null;
  }

  /**
   * Hold seats (freeze during checkout)
   */
  async holdSeats(dto: HoldSeatsDto): Promise<{
    success: boolean;
    holdToken: string;
    expiresAt: Date;
    seats: SeatResponse[];
  }> {
    const { eventId, seatIds, customerId } = dto;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException('No seats selected');
    }

    // 1. Validate Ownership in Redis
    const redisKeys = seatIds.map(id => `lock:event:${eventId}:seat:${id}`);
    const locks = await this.redis.mget(...redisKeys);

    for (let i = 0; i < seatIds.length; i++) {
      if (locks[i] !== customerId) {
        throw new ConflictException(`Seat ${seatIds[i]} is no longer locked by you. Please re-select.`);
      }
    }

    // 2. Extend/Convert locks to "HELD" in Redis (just a longer TTL)
    const event = await this.eventModel.findById(eventId).lean();
    const holdTimeoutMinutes = event.seatHoldTimeout || 2;
    const holdExpiry = new Date(Date.now() + holdTimeoutMinutes * 60 * 1000);

    const pipeline = this.redis.pipeline();
    redisKeys.forEach(key => {
      pipeline.expire(key, holdTimeoutMinutes * 60);
    });
    await pipeline.exec();

    // 3. Prepare response (Stateless)
    const seatObjectIds = seatIds.map(id => new Types.ObjectId(id));
    const heldSeats = await this.seatModel.find({
      _id: { $in: seatObjectIds }
    }).lean();

    const holdToken = this.generateHoldToken(customerId, seatIds, holdExpiry);

    // Broadcast change
    seatIds.forEach((seatId) => {
      this.eventGateway.broadcastSeatStatusChange(eventId, seatId, SeatStatus.HELD);
    });

    return {
      success: true,
      holdToken,
      expiresAt: holdExpiry,
      seats: heldSeats.map(seat => this.mapSeatToResponse(seat)),
    };
  }

  /**
   * Release held seats
   */
  async releaseHeldSeats(seatIds: string[], eventId: string): Promise<void> {
    await this.seatModel.updateMany(
      {
        _id: { $in: seatIds },
        eventId: eventId,
        status: SeatStatus.HELD,
      },
      {
        $set: { status: SeatStatus.AVAILABLE },
        $unset: { holdExpiresAt: '', heldBy: '' },
      },
    );

    seatIds.forEach((seatId) => {
      this.eventGateway.broadcastSeatStatusChange(eventId, seatId, SeatStatus.AVAILABLE);
    });
  }

  /**
   * Confirm purchase - convert HELD to SOLD
   */
  async confirmPurchase(
    seatIds: string[],
    eventId: string,
    customerId: string,
  ): Promise<SeatResponse[]> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const seatObjectIds = seatIds.map(id => new Types.ObjectId(id));
      const eventObjectId = new Types.ObjectId(eventId);

      // 1. Final Redis Validation
      const redisKeys = seatIds.map(id => `lock:event:${eventId}:seat:${id}`);
      const locks = await this.redis.mget(...redisKeys);

      for (let i = 0; i < seatIds.length; i++) {
        if (locks[i] !== customerId) {
          throw new ConflictException(`Hold for seat ${seatIds[i]} has expired or was lost. Purchase failed.`);
        }
      }

      // 2. Atomic MongoDB Purchase
      const seats = await this.seatModel.find({
        _id: { $in: seatObjectIds },
        eventId: eventObjectId,
      }).session(session).lean();

      // Ensure no concurrent permanent status changes occurred
      const invalidSeats = seats.filter(
        (seat) => [SeatStatus.SOLD, SeatStatus.BLOCKED].includes(seat.status as any)
      );

      if (invalidSeats.length > 0) {
        throw new ConflictException('Some seats are no longer available for purchase');
      }

      await this.seatModel.updateMany(
        {
          _id: { $in: seatObjectIds },
          eventId: eventObjectId,
        },
        {
          $set: { status: SeatStatus.SOLD },
          $unset: { holdExpiresAt: '', heldBy: '' },
        },
        { session },
      );

      // 3. Clear Redis Locks
      await this.redis.del(...redisKeys);

      const soldSeats = await this.seatModel.find({
        _id: { $in: seatObjectIds }
      }).session(session).lean();

      // Fetch zone prices
      const zoneIds = [...new Set(soldSeats.map(s => s.zoneId))];
      const zones = await this.zoneModel.find({ _id: { $in: zoneIds } }).session(session).lean();

      // Create Tickets for each sold seat
      const ticketsToCreate = soldSeats.map(seat => {
        const zone = zones.find(z => z._id.toString() === seat.zoneId.toString());
        return {
          ticketCode: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          eventId: seat.eventId,
          customerId: new Types.ObjectId(customerId),
          seatId: seat._id,
          zoneId: seat.zoneId,
          pricePaid: zone?.price || 0,
          status: 'VALID',
          discountApplied: 0
        };
      });

      await this.ticketModel.insertMany(ticketsToCreate, { session });

      await session.commitTransaction();

      seatIds.forEach((seatId) => {
        this.eventGateway.broadcastSeatStatusChange(eventId, seatId, SeatStatus.SOLD);
      });

      return soldSeats.map(seat => this.mapSeatToResponse(seat));
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Lock a single seat temporarily
   * Part of the "Process Flow" in User Request Section 2
   */
  async lockSeat(eventSeatId: string, userId: string): Promise<{ success: boolean; expiresAt: Date }> {
    const seat = await this.seatModel.findById(eventSeatId).lean();
    if (!seat) {
      throw new BadRequestException('Seat not found');
    }

    // 1. Permanent State Check (SQL/MongoDB)
    // If the seat is already sold or blocked in the DB, it's not available
    if ([SeatStatus.SOLD, SeatStatus.BLOCKED].includes(seat.status)) {
      throw new ConflictException('Seat is no longer available');
    }

    const eventId = seat.eventId.toString();
    const redisKey = `lock:event:${eventId}:seat:${eventSeatId}`;

    // 2. Atomic Lock via Redis Lua Script
    // Arguments: [redisKey, userId, ttlInSeconds]
    const luaScript = `
      local lockExists = redis.call("EXISTS", KEYS[1])
      if lockExists == 0 then
        redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[2])
        return 1
      else
        local currentLock = redis.call("GET", KEYS[1])
        if currentLock == ARGV[1] then
          -- Refresh existing lock
          redis.call("EXPIRE", KEYS[1], ARGV[2])
          return 1
        end
        return 0
      end
    `;

    const event = await this.eventModel.findById(eventId).lean();
    const holdTimeoutMinutes = (event as any)?.seatHoldTimeout || 2;
    const ttlSeconds = holdTimeoutMinutes * 60;

    const result = await this.redis.eval(luaScript, 1, redisKey, userId, ttlSeconds);

    if (result !== 1) {
      throw new ConflictException('Seat is already locked by another user');
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Optional: Sync back to Mongo for legacy reporting if needed, 
    // but the user's "Zero DB writes" advice says we shouldn't.
    // However, to keep the UI consistent if it still queries Mongo, we might need it.
    // For now, let's stick to the optimization: NO DB WRITES for locks.

    // Broadcast change
    this.eventGateway.broadcastSeatStatusChange(eventId, eventSeatId, SeatStatus.LOCKED);

    return {
      success: true,
      expiresAt,
    };
  }

  @Cron('* * * * *')
  async handleExpiredLocks(): Promise<void> {
    const now = new Date();

    // Redis handles LOCKED TTL automatically.
    // We only need to clean up HELD status for seats that reached checkout but weren't bought.
    const legacyExpiredSeats = await this.seatModel.find({
      status: SeatStatus.HELD,
      holdExpiresAt: { $lt: now },
    }).lean();

    if (legacyExpiredSeats.length > 0) {
      const result = await this.seatModel.updateMany(
        { status: SeatStatus.HELD, holdExpiresAt: { $lt: now } },
        { $set: { status: SeatStatus.AVAILABLE }, $unset: { holdExpiresAt: '', heldBy: '' } }
      );

      console.log(`Cleanup: Released ${result.modifiedCount} expired seat holds (HELD)`);

      legacyExpiredSeats.forEach((seat) => {
        this.eventGateway.broadcastSeatStatusChange(
          seat.eventId.toString(),
          seat._id.toString(),
          SeatStatus.AVAILABLE,
        );
      });
    }
  }

  /**
   * Admin: Block/Unblock seats
   */
  async blockSeats(seatIds: string[], eventId: string): Promise<void> {
    await this.seatModel.updateMany(
      {
        _id: { $in: seatIds },
        eventId: eventId,
        status: SeatStatus.AVAILABLE,
      },
      {
        $set: { status: SeatStatus.BLOCKED },
      },
    );

    seatIds.forEach((seatId) => {
      this.eventGateway.broadcastSeatStatusChange(eventId, seatId, SeatStatus.BLOCKED);
    });
  }

  async unblockSeats(seatIds: string[], eventId: string): Promise<void> {
    await this.seatModel.updateMany(
      {
        _id: { $in: seatIds },
        eventId: eventId,
        status: SeatStatus.BLOCKED,
      },
      {
        $set: { status: SeatStatus.AVAILABLE },
      },
    );

    seatIds.forEach((seatId) => {
      this.eventGateway.broadcastSeatStatusChange(eventId, seatId, SeatStatus.AVAILABLE);
    });
  }

  /**
   * Get seats held by a customer
   */
  async getCustomerHeldSeats(customerId: string, eventId?: string): Promise<SeatResponse[]> {
    const query: any = {
      heldBy: customerId,
      status: SeatStatus.HELD,
    };

    if (eventId) {
      query.eventId = eventId;
    }

    const seats = await this.seatModel.find(query).lean();
    return seats.map(seat => this.mapSeatToResponse(seat));
  }

  /**
   * Helper: Generate hold token
   */
  private generateHoldToken(
    customerId: string,
    seatIds: string[],
    expiresAt: Date,
  ): string {
    const payload = {
      customerId,
      seatIds,
      expiresAt: expiresAt.toISOString(),
      timestamp: Date.now(),
    };

    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Helper: Verify hold token
   */
  verifyHoldToken(token: string): {
    customerId: string;
    seatIds: string[];
    expiresAt: Date;
  } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return {
        customerId: decoded.customerId,
        seatIds: decoded.seatIds,
        expiresAt: new Date(decoded.expiresAt),
      };
    } catch (error) {
      throw new BadRequestException('Invalid hold token');
    }
  }

  /**
   * Helper: Map seat document to response
   */
  private mapSeatToResponse(seat: any): SeatResponse {
    return {
      _id: seat._id.toString(),
      eventId: seat.eventId.toString(),
      zoneId: seat.zoneId.toString(),
      row: seat.row,
      seatNumber: seat.seatNumber,
      status: seat.status,
      holdExpiresAt: seat.holdExpiresAt,
      heldBy: seat.heldBy?.toString(),
      position: seat.position,
      isAccessible: seat.isAccessible,
      isAisle: seat.isAisle,
    };
  }
}