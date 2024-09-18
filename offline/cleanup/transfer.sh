#!/usr/bin/bash
source /etc/drumee/drumee.sh
echo $0 
workdir=$(dirname $0)
#echo $workdir
$workdir/transfer.js --host=$1
find /data/mfs/__download__/ -type f -mtime +30 -exec rm -rf {} \; 