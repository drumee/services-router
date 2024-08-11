#!/bin/bash

source /etc/drumee/drumee.sh
wd=$(dirname $(readlink -f $0 ))
cd $wd
if [ -z $1 ]; then 
  count=1
else 
  count=$1
fi

su -s /bin/bash $DRUMEE_SYSTEM_USER -c "HOME=$DRUMEE_SERVER_HOME \
  $wd/offline/factory.hub.js --schemas=$wd/schemas --count=$count"
