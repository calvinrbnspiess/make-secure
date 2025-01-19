#!/bin/bash

# make sure to install gum on ubuntu/debian

# Check if the script is running on ubuntu/debian and if apt is available
if ! command -v apt &> /dev/null; then
    echo "This script requires apt but it's not installed. Exiting."
    exit 1
fi

## install dependencies
apt -y update; apt -y install curl gpg coreutils ca-certificates net-tools vim

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

# configure apache2    

# Set the ServerName directive in the Apache configuration (do not replace comments, remove duplicates, append if not present)
sed -i '/^[^#]*ServerName /d; $a ServerName 127.0.0.1:8282' /usr/local/apache2/conf/httpd.conf

sed -i -e 's/^#\(Include .*httpd-ssl.conf\)/\1/' -e 's/^#\(LoadModule .*mod_ssl.so\)/\1/' -e 's/^#\(LoadModule .*mod_ssl.so\)/\1/' -e 's/^#\(LoadModule .*mod_socache_shmcb.so\)/\1/' /usr/local/apache2/conf/httpd.conf

# Make sure to set up certificate files inside <VirtualHost> blocks
sed -i '/<VirtualHost/,/<\/VirtualHost>/ {
  /^[^#]*SSLCertificateFile /d
  /<VirtualHost.*>/a\ SSLCertificateFile /usr/local/apache2/certificates/cert.pem
}' /usr/local/apache2/conf/extra/httpd-ssl.conf

sed -i '/<VirtualHost/,/<\/VirtualHost>/ {
  /^[^#]*SSLCertificateKeyFile /d
  /<VirtualHost.*>/a\ SSLCertificateKeyFile /usr/local/apache2/certificates/key.pem
}' /usr/local/apache2/conf/extra/httpd-ssl.conf

apachectl configtest
apachectl restart