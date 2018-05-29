#!/bin/bash
# Hardcoded to hlfv1 - will need to be updated for v11 at some point :)
echo "Development only script for Hyperledger Fabric control"

start_fabric() {
    # starts all dangling containers 
    # irrespective of whether they are related to Fabric or NOT 
    echo "Starting all containers"
    docker ps -q -a | xargs docker start
    echo
    echo 'BNA container may still show up as dangling/exited - First command will start BNA'
    echo 'Fabric DEV environment started !!!'
    
}

stop_fabric() {
    cd ./fabric-scripts/hlfv1/composer
    docker-compose stop
    echo
    echo 'Fabric DEV environment stopped - DO NOT Clean the containers :)'
}

case $1 in 
    start)
        start_fabric
        ;;
    stop)
        stop_fabric
        ;;
    *)
        echo 'Usage: ./fabricUtil start | stop'
esac
