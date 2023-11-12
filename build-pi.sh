#!/usr/bin/env bash
docker buildx build --platform linux/arm/v7 -t stryjek4/sms-socket-api:rpi . --push
