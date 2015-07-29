#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

$DIR/node_modules/supervisor/lib/cli-wrapper.js -w $DIR $DIR/index.js
