@echo off
echo Fixing Prisma environment issues...
echo.

echo Current system DATABASE_URL:
echo %DATABASE_URL%
echo.

echo Setting DATABASE_URL to null temporarily...
set DATABASE_URL=

echo Running Prisma commands with .env file...
echo.

echo 1. Checking migration status...
npx prisma migrate status
echo.

echo 2. Generating Prisma client...
npx prisma generate
echo.

echo 3. Checking database connection...
npx prisma db pull --print
echo.

echo Done! Prisma should now work properly.
pause