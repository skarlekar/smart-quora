#!/bin/bash


if [ $# -ne 6 ]
then
    echo "Usage: $0 -u <user-name> -f <first-name> -l <last-name>"
    exit 1
fi

if [  "$1" != "-u"  -a  "$3" != "-f"  -a  "$5" != "-l" ]
then
    echo "Parameter order should be username, firstname and lastname."
    exit 1
fi

export EMAIL=\"$2@email.com\"
export FNAME=\"$4\"
export LNAME=\"$6\"

composer participant add -c admin@smartquora-bna -d '{
  "$class": "smartquora.participant.QuoraUser",
  "rank": 1,
  "token": 100,
  "emailId": '$EMAIL',
  "fName": '$FNAME',
  "lname": '$LNAME'
}'
composer identity issue -c admin@smartquora-bna -f $2.card -u $2 -a "resource:smartquora.participant.QuoraUser#$2@email.com"
#echo composer card export -f $2.card -c $2@smartquora-bna 
