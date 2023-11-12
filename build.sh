#!/usr/bin/env bash
docker build --platform linux/amd64 -t stryjek4/sms-socket-api .
docker push stryjek4/sms-socket-api
