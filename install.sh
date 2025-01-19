#!/bin/bash

# make sure to install gum on ubuntu/debian

## install dependencies
apt-get -y update; apt-get -y install curl gpg coreutils ca-certificates

## install gum
mkdir -p /etc/apt/keyrings
curl -fsSL https://repo.charm.sh/apt/gpg.key | gpg --dearmor -o /etc/apt/keyrings/charm.gpg
echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | tee /etc/apt/sources.list.d/charm.list
apt update && apt install -y gum

clear

# main procedure
gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "2 4" \
    --bold \
    'TLS Configurator' \
    'Sample script to secure apache2 with ssl/tls.'

