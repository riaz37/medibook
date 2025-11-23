# Redis Configuration for MediBook

## Environment Variables

Add the following to your `.env` file:

```env
# Redis Configuration
# For local development (if running Redis locally)
REDIS_URL=redis://localhost:6379

# For production (Upstash or other Redis provider)
# REDIS_URL=redis://default:your-password@your-redis-host:6379

# For Upstash Redis (alternative)
# UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-token
```

## Local Development Setup

### Option 1: Docker (Recommended)

```bash
# Run Redis in Docker
docker run -d --name medibook-redis -p 6379:6379 redis:alpine

# Stop Redis
docker stop medibook-redis

# Start Redis
docker start medibook-redis
```

### Option 2: Install Redis Locally

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
Use WSL2 or download from https://redis.io/download

## Production Setup

### Upstash (Recommended for Serverless)

1. Go to https://upstash.com/
2. Create a new Redis database
3. Copy the `REDIS_URL` from the dashboard
4. Add to your production environment variables

### Other Options

- **AWS ElastiCache**
- **Redis Cloud**
- **DigitalOcean Managed Redis**
- **Railway** (has Redis add-on)

## Testing Redis Connection

```bash
# Test if Redis is running locally
redis-cli ping
# Should return: PONG

# Or use Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(console.log).catch(console.error).finally(() => redis.quit());"
```

## Cache Configuration

The application will gracefully degrade if Redis is not available:
- All cache operations will be skipped
- Application will function normally (just slower)
- No errors will be thrown

## Monitoring

To monitor Redis in development:

```bash
# Monitor all commands
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys "*"

# Clear all cache
redis-cli FLUSHDB
```

## Cache Keys Structure

```
medibook:doctor:{id}                    - Individual doctor
medibook:doctors:available              - Available doctors list
medibook:doctors:list                   - All doctors list
medibook:appointment:{id}               - Individual appointment
medibook:appointments:doctor:{doctorId} - Doctor's appointments
medibook:appointments:patient:{userId}  - Patient's appointments
medibook:medications:search:{query}     - Medication search results
medibook:settings:commission            - Commission settings
medibook:admin:stats                    - Admin statistics
```

## Performance Expectations

With Redis enabled:
- **Doctor listings**: ~10ms (vs ~200ms without cache)
- **Individual doctor**: ~5ms (vs ~50ms without cache)
- **Medication search**: ~5ms (vs ~100ms without cache)
- **Admin stats**: ~5ms (vs ~500ms without cache)

## Troubleshooting

### Redis connection refused
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env
- Check firewall settings

### High memory usage
- Monitor with: `redis-cli info memory`
- Clear cache: `redis-cli FLUSHDB`
- Adjust TTL values in `cache.service.ts`

### Cache not invalidating
- Check invalidation patterns in services
- Manually clear: `redis-cli DEL "medibook:doctors:*"`
