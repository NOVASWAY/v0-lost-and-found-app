# Backup & Restore — Vault Lost & Found (Neon Postgres)

## Automated Backups

Neon provides automatic daily backups retained for 7 days (Free tier) or 30 days (Launch tier).
Check your retention window in the Neon console → project → Backups.

## Manual Backup (pg_dump)

```bash
# Export the full database
pg_dump "$PROD_DATABASE_URL" > vault-backup-$(date +%Y%m%d).sql

# Compressed export
pg_dump "$PROD_DATABASE_URL" | gzip > vault-backup-$(date +%Y%m%d).sql.gz
```

## Restore from Backup

```bash
# Restore to the same database (CAUTION: overwrites current data)
psql "$PROD_DATABASE_URL" < vault-backup-20260822.sql

# Restore compressed backup
gunzip -c vault-backup-20260822.sql.gz | psql "$PROD_DATABASE_URL"

# Restore to a fresh database (create tables first)
npx prisma migrate deploy
psql "$PROD_DATABASE_URL" < vault-backup-20260822.sql
```

## Neon Point-in-Time Recovery (PITR)

Neon Launch/Scale tiers support PITR. To restore:

1. Go to Neon console → project → Backups
2. Select the restore point (timestamp or LSN)
3. Create a new branch from the restore point
4. Update `DATABASE_URL` in Vercel to point to the new branch
5. Redeploy

## Vercel Cron Backups

For automated weekly backups to external storage, add a backup cron endpoint:

```bash
# Example: backup to S3-compatible storage
curl -X POST "$PROD_DATABASE_URL/backup" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Post-Restore Verification

After any restore:

1. Run `npx prisma migrate deploy` to ensure schema is current
2. Verify seed data: `pnpm db:seed` (idempotent)
3. Test login: POST `/api/auth/login` with valid credentials
4. Check audit logs: GET `/api/audit-logs`
5. Verify items: GET `/api/items`
