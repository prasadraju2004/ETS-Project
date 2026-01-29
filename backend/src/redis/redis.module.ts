import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (config: ConfigService) => {
                const url = config.get<string>('REDIS_URL') || 'redis://localhost:6379';
                const redis = new Redis(url, {
                    maxRetriesPerRequest: null,
                    retryStrategy: (times) => Math.min(times * 50, 2000),
                });

                redis.on('connect', () => console.log('✅ Connected to Redis'));
                redis.on('error', (err) => console.error('❌ Redis Connection Error:', err));

                return redis;
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }
