#!/bin/sh
first=`docker ps | grep "dev-peer0" | cut -c1-12 | head -n 1`
echo "Latest container: $first"
rest=`docker ps | grep "dev-peer0" | cut -c1-12 | grep -v $first`
echo "Stopped containers: "
docker stop $rest
echo "Removed containers: "
docker rm $rest
