#!/bin/sh
echo "Starting hotreload and database emulator..."
npm run dev & firebase emulators:start --only "database,auth" && fg