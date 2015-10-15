#!/bin/sh
APP_DIR=/srv/webhooks-tool
DATA_DIR=/data

$APP_DIR/node_modules/supervisor/lib/cli-wrapper.js -- $APP_DIR/index.js -d $DATA_DIR
