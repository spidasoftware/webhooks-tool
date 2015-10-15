FROM alpine:3.2

ADD . /build
RUN apk --update add nodejs=0.12.2-r0 make=4.1-r0 g++=4.9.2-r5 git=2.4.1-r0 python=2.7.10-r1 \
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
	&& mkdir /data
WORKDIR /srv/webhooks-tool

ENV WEBHOOK_MIN_BASE_URL="http://spida_spidamin_1:8080/"
ENV WEBHOOK_SERVER_URL="http://spida_webhooks_1:8080/"

VOLUME ["/data"]
EXPOSE 8080
ENTRYPOINT ["/srv/webhooks-tool/start-docker.sh"]
