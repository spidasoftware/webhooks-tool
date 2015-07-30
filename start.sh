#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

$DIR/node_modules/supervisor/lib/cli-wrapper.js -w "$DIR/index.js,$DIR/src" --save-pid "$DIR/webhooks-tool.pid" -- $DIR/index.js -d $DIR/data
