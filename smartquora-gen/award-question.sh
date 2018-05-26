#!/bin/bash


if [ $# -ne 1 ]
then
    echo "Usage: $0 <question-id>"
    exit 1
fi

export Q="\"resource:smartquora.question.Question#$1\""

composer transaction submit -c admin@smartquora-bna -d '
{
  "$class": "smartquora.question.AwardQuestion",
  "question":'$Q' 
} '
