#!/bin/bash

action=$1
type=$2
source /etc/drumee/drumee.sh
base=$DRUMEE_SERVER_HOME/build/somanos
case "$action" in
  stop)
	touch /var/run/drumee/factory.$type.stop
	;;
  start)
	rm -f /var/run/drumee/factory.$type.stop
	export SCHEMAS_PATH=/home/somanos/devel/schemas/
	#export DATASET=$base/server/build/dataset/$user
	$base/offline/factory.$type.js 

	;;
    *)
	echo "Usage: $NAME username {stop|start} {hub|account}" >&2
	exit 3
	;;
esac
