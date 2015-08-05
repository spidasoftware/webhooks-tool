#!/bin/sh

echo '{"testSTDIN":'
while read -r LINE; do
	echo $LINE
done
echo '}'
