#!/bin/sh

echo "Freeing necessary ports"
for i in 8080 4000 4500 8085 9099 4400 
do
	some_pid=$( fuser $i/tcp 2> /dev/null )
	if [ ! -z $some_pid ]; then
		echo Killing $some_pid for using $i/tcp
		kill -9 $some_pid
	fi
done

echo "Starting hotreload and database emulator..."
npm run dev & firebase emulators:start --only "database,auth" && fg