# Coolify Deployment Guide

## Important: Shared Database Configuration

⚠️ **You are using the same database for development and production.**

This means:
- ✅ No need to run migrations/seeds in production (already done)
- ✅ Database schema is already synced
- ⚠️ Be careful with destructive operations
- ⚠️ Make sure `NEXTAUTH_URL` is updated for production

## Build Pack Selection

### Recommended: **Dockerfile**
- More control and optimized for Next.js standalone
- Better production performance
- Select "Dockerfile" in Coolify

### Alternative: **Nixpacks**
- Auto-detects Next.js
- Easier setup
- Select "Nixpacks" in Coolify

## Environment Variables for Coolify

Copy these from your `.env` file to Coolify's environment variables:

### Required Variables:
```env
DATABASE_URL=mysql://root:Prof%4015%401f1femsk@5.189.130.31:3333/vcFiles
NEXTAUTH_SECRET=b1d5f5c3b8f34d7b9f9420b2a0e385b6b88a94cb1ef99c63a6d82b59f142d879
NEXTAUTH_URL=https://your-production-domain.com  # ⚠️ UPDATE THIS!
```

### BunnyCDN Configuration:
```env
BUNNY_ACCESS_KEY=f7027e33-cebb-454a-93e22e35a40e-dc57-4174
BUNNY_STORAGE_ZONE=vculture
BUNNY_STORAGE_URL=https://vculture.b-cdn.net
BUNNY_CDN_URL=https://cdn.bunny.net
```

### Application Configuration:
```env
APPID=1001
BRANCH=1000
COMPANYID=1001
NEXR_COMPANY_VAT=EL094348514
NEXT_COMPANY_ADDRESS=ΛΗΤΟΥΣ 7 - ΚΟΡΩΠΙ
NEXT_COMPANY_ISSUED_DATE=08-11-2024
NEXT_COMPANY_NAME=ΝΤΑΤΑ ΠΡΙΝΤ ΕΤΕΡΟΡΡΥΘΜΗ ΕΜΠΟΡΙΚΗ ΚΑΙ ΒΙΟΜΗΧΑΝΙΚΗ ΕΤΑΙΡΕΙΑ ΕΚΤΥΠΩΣΕΩΝ
NEXT_COMPANY_REPRESENTATIVE=ΑΝΤΩΝΗΣ ΜΙΛΑΣ
NEXT_COMPANY_SERIAL=55GFQL-OOIXLOLK-0012312
NEXT_VENTOR_NAME=WORLDWIDE ACTIVITIES ΜΟΝΟΠΡΟΣΩΠΗ Ι Κ Ε
```

### SMTP Configuration:
```env
SMTP_ENABLED=true
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=2525
SMTP_USER=info@wwa.gr
SMTP_PASS=Prof@15@1f1femsk
SMTP_FROM=info@wwa.gr
SMTP_FROM_NAME="DATA PRINT"
```

### ERP Integration:
```env
SOFTURL=https://kolleris.oncloud.gr/s1services
USERNAME=cronusweb
PASSWORD=1f1femsk
```

### Optional (Redis is disabled):
```env
REDIS_URL=redis://default:VisW44x7I3mYKXHlUzvpMiJT2X7wRuY0qG6XDxVjHZq7f59Af0W1qbxw4SDRqRPP@5.189.130.31:4444/10
```

## Deployment Steps

### 1. In Coolify Dashboard:
1. Create a new application
2. Connect your Git repository
3. **Build Pack**: Select "Dockerfile" (or "Nixpacks")
4. **Port**: 3000 (default)
5. Add all environment variables listed above

### 2. Important: Update NEXTAUTH_URL
⚠️ **CRITICAL**: Change `NEXTAUTH_URL` in Coolify to your production domain:
```
NEXTAUTH_URL=https://your-production-domain.com
```

### 3. Build Settings (if using Nixpacks):
- **Node Version**: 22 (auto-detected from `.nvmrc`)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 4. Build Settings (if using Dockerfile):
- **Dockerfile Location**: `Dockerfile` (default)
- No additional build commands needed

## Post-Deployment

### ✅ What NOT to do:
- ❌ **DO NOT** run `npm run db:seed` in production (database is already seeded)
- ❌ **DO NOT** run `npx prisma db push` unless you have schema changes
- ❌ **DO NOT** run migrations that might affect development

### ✅ What to do:
- ✅ Verify the application starts successfully
- ✅ Test authentication (login/logout)
- ✅ Verify database connection works
- ✅ Test file uploads and CDN access
- ✅ Check GDPR reports functionality

## Database Access

Since you're using the same database:
- All users, departments, and data are shared
- Changes in production affect development
- Changes in development affect production
- Be cautious with data modifications

## Troubleshooting

### If the app fails to start:
1. Check environment variables are set correctly
2. Verify `NEXTAUTH_URL` matches your production domain
3. Check database connection (same DB should work)
4. Review Coolify logs for errors

### If database connection fails:
- Verify `DATABASE_URL` is correctly URL-encoded
- Check if the database server allows connections from Coolify's IP
- Ensure MySQL port 3333 is accessible

### If Prisma errors occur:
- The Dockerfile includes Prisma generation
- If needed, you can run `npx prisma generate` in Coolify's console
- But since DB is shared, schema should already be in sync

## Security Notes

⚠️ **Important Security Considerations:**
- Your `.env` file contains sensitive credentials
- Never commit `.env` to Git (it's in `.gitignore`)
- Use Coolify's secure environment variable storage
- Consider using different credentials for production in the future
- The database password is visible in `DATABASE_URL` - ensure Coolify's env vars are secure
