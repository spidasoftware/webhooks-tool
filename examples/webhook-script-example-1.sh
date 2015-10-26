#!/bin/bash
#NOTE: this script must be executable: chmod +x webhook-script-example-1.sh

#args passed in
echo "Webhook name: $1"
echo "Webhook event name: $2"

#data passed to stdin
read data
echo "stdin data: $data"
