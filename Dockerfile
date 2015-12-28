FROM alpine:3.3

ADD . /build
RUN apk --update add nodejs=4.2.3-r0 make=4.1-r0 g++=5.3.0-r0 git=2.6.4-r0 python=2.7.11-r2 \
	&& rm -rf /var/cache/apk/* \
	&& cd /build \
	&& npm install -g grunt-cli@0.1.13 bower@1.6.2 \
	&& npm install \
	&& bower --allow-root install \
	&& grunt package \
	&& mkdir /srv \
	&& cd /srv \
	&& tar xfvz /build/webhooksTool*.tar.gz \
	&& cp /build/start-docker.sh /srv/webhooks-tool \
	&& rm -rf /build \
	&& apk del make g++ git python \
	&& npm uninstall -g grunt-cli bower \
	&& mkdir /data /scripts
WORKDIR /srv/webhooks-tool

ENV WEBHOOK_MIN_BASE_URL="http://spidamin:8080/"
ENV WEBHOOK_SERVER_URL="http://webhooks:8080/"

VOLUME ["/data","/scripts"]
EXPOSE 8080

CMD ["node", "/srv/webhooks-tool/index.js", "-w", "/dev/null"]
