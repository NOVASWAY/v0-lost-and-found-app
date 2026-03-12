# Vault Church Lost & Found - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
\`\`\`bash
# Create .env.local with the following:
DATABASE_URL="postgresql://user:password@host:port/dbname"
NODE_ENV="production"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
\`\`\`

### 2. Database Setup
\`\`\`bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate deploy

# Seed production data
npx prisma db seed
\`\`\`

### 3. Verify Installations
\`\`\`bash
# Check database connection
npx prisma db validate

# Run validation script
npx ts-node scripts/validate-production.ts
\`\`\`

## Deployment Steps

### Step 1: Pre-Production Build
\`\`\`bash
# Build the Next.js application
npm run build

# Test the production build locally
npm run start
\`\`\`

### Step 2: Deploy to Vercel (Recommended)
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - DATABASE_URL
# - NODE_ENV=production
# - NEXTAUTH_SECRET
\`\`\`

### Step 3: Post-Deployment Verification
\`\`\`
1. Navigate to https://yourdomain.com
2. Test login with all three account types
3. Verify all features are working
4. Check error logs in production
5. Run validation script in production
\`\`\`

## Security Hardening

### HTTPS/SSL
- Enable in Vercel deployment settings
- Force HTTPS redirects
- Set HSTS headers

### Database Security
- Use strong passwords
- Enable SSL connections
- Set up IP whitelisting
- Regular backups

### Application Security
- Rate limiting active
- CORS properly configured
- CSP headers in middleware
- No sensitive data in logs

## Monitoring & Maintenance

### Daily
- Check error logs
- Monitor rate limits
- Verify backup completion

### Weekly
- Review audit logs
- Check disk usage
- Verify all features working

### Monthly
- Update dependencies
- Review security patches
- Test disaster recovery
- Clean old audit logs

## Rollback Procedure

\`\`\`bash
# If deployment fails:
vercel rollback

# Or manually redeploy previous version
vercel --prod --confirm
\`\`\`

## Production Account Credentials

**IMPORTANT: Change these immediately after initial setup**

### Admin
- Email: admin@vaultchurch.org
- Password: AdminVault123!@#

### Volunteer
- Email: volunteer@vaultchurch.org
- Password: Volunteer@2024#Secure

### Regular User
- Email: john.doe@vaultchurch.org
- Password: SecureUser123!@#

## Database Backup Strategy

### Automated Backups
- Daily backups to AWS S3
- Retention: 30 days
- Encryption at rest

### Manual Backup
\`\`\`bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
\`\`\`

## Performance Optimization

### Caching
- Items list: 5 minutes
- User profiles: 10 minutes
- Audit logs: no caching

### Database Optimization
- Indexes on: userId, itemId, status
- Connection pooling enabled
- Query optimization verified

### CDN Configuration
- Images served via CDN
- Static assets cached
- API routes: no-cache

## Troubleshooting

### Database Connection Issues
\`\`\`
Error: "getaddrinfo ENOTFOUND"
Solution: Verify DATABASE_URL format and connectivity
\`\`\`

### Authentication Failures
\`\`\`
Error: "Invalid credentials"
Solution: Check password hashing, verify user exists
\`\`\`

### Rate Limiting
\`\`\`
Error: "429 Too Many Requests"
Solution: Wait or clear rate limit cache
\`\`\`

### Memory Issues
\`\`\`
Error: "OutOfMemory"
Solution: Increase Node.js heap size or optimize queries
\`\`\`

## Support & Escalation

For deployment issues:
1. Check error logs in Vercel dashboard
2. Review recent changes
3. Check database connectivity
4. Contact technical support if unresolved

---

**Deployment Date**: [INSERT DATE]
**Deployed By**: [INSERT NAME]
**Version**: 1.0.0 Production
**Status**: ✅ LIVE
