#!/bin/bash
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

if [ -f /etc/supervisor/supervisord.conf ]; then
	SUPERVISORD_CONF=/etc/supervisor/supervisord.conf
else
	SUPERVISORD_CONF=/etc/supervisord.conf
fi

echo Creating webhooks user if it "doesn't" exist
id -u webhooks || useradd -r -U webhooks

echo Changing ownership of webhooks-tool to webhooks user
chown -R webhooks:webhooks $DIR
chmod -R o-rwx $DIR

echo Installing program section to supervisord.conf if not already there
grep -q "\[program:webhooks-tool\]" $SUPERVISORD_CONF || sed -e "s|###INSTALL_PATH###|$DIR|g" < $DIR/install/supervisord.conf >> $SUPERVISORD_CONF

echo Starting webhooks-tool
supervisorctl reload 

echo 'Done.'
