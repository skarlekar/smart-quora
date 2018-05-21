PID=`lsof -i :3000 | cut -c 8-13 | grep -v "PID" | tr -d '[:space:]'`
[ -z "$PID" ] && echo "Composer REST Server not running on port 3000" || echo "Killing $PID"
[ -z "$PID" ] && echo "Nothing to kill!" || kill $PID
