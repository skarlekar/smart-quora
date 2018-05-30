#!/bin/bash

if [ $# -ne 1 ]
then
	echo "Usage: $0 <your-host-name-without-protocol-or-port>"
	exit 1
fi

for f in ../www/*.html; do
  node replacer $f your-host-name $1 ;
  done


