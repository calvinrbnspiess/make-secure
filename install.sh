#!/bin/bash

# make sure to install gum on ubuntu/debian

# Check if the script is running on ubuntu/debian and if apt is available
if ! command -v apt &> /dev/null; then
    echo "This script requires apt but it's not installed. Exiting."
    exit 1
fi

## install dependencies
apt -y update; apt -y install curl gpg coreutils ca-certificates net-tools vim bsdmainutils procps testssl.sh jq

## install gum
mkdir -p /etc/apt/keyrings
curl -fsSL https://repo.charm.sh/apt/gpg.key | gpg --dearmor -o-y  /etc/apt/keyrings/charm.gpg
echo "deb [signed-by=/etc/apt/keyrings/charm.gpg trusted=yes] https://repo.charm.sh/apt/ * *" | tee /etc/apt/sources.list.d/charm.list
apt update && apt install -y gum

#clear

# main procedure
gum style \
    --foreground 212 --border-foreground 212 --border double \
    --align center --width 50 --margin "1 2" --padding "2 4" \
    --bold \
    'TLS Configurator' \
    'Sample script to secure apache2 with ssl/tls.'

# get server public address

function testAvailability() {
  # Check HTTP (port 80)
  if curl -s --max-time 5 localhost:80 > /dev/null; then
      http_accessible=true
      echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'HTTP okay')"
  fi

  # Check HTTPS (port 443)
  if curl -s --max-time 5 localhost:443 > /dev/null; then
      https_accessible=true
      echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'HTTPS okay')"
  else
    echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'HTTPS not accessible')"
  fi
}

# test availability

http_accessible=false
https_accessible=false

testAvailability

sleep 1

# test current capabilities

mkdir -p /tmp/tls-configurator

function print_testssl_feature() {
  local id="$1"
  local name="$2"
  local file="$3"

  local value=$(jq -r --arg id "$id" '.[] | select(.id == $id) | .finding' "$file")

  echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' "$name")$(gum style --foreground 'black' ':') $(gum style --foreground '212' "$value")"
}

function testBefore() {
  rm -f /tmp/tls-configurator/testssl-before.json

  gum spin --spinner dot --title "Testing current capabilites using testssl ..." -- testssl --jsonfile /tmp/tls-configurator/testssl-before.json localhost > /dev/null

  clear

  gum style \
	--foreground 212 --border-foreground 212 --border double \
	--align center --width 50 --margin "1 2" --padding "2 4" \
	'Current Capabilities'

  print_testssl_feature "ALPN" "ALPN" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "TLS1" "TLS1" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "TLS1_2" "TLS1.2" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "TLS1_3" "TLS1.3" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "banner_server" "Banner Server" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "HTTP_status_code" "HTTP Status Code" /tmp/tls-configurator/testssl-before.json

  print_testssl_feature "cert_fingerprintSHA256" "Certificate Fingerprint" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "cert_caIssuers" "Certificate Issuer" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "cert_trust" "Certificate Trust" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "cert_chain_of_trust" "Certificate Chain of Trust" /tmp/tls-configurator/testssl-before.json
  print_testssl_feature "cert_expirationStatus" "Certificate Expiration" /tmp/tls-configurator/testssl-before.json
}

if [[ "$https_accessible" == true ]]; then
  testBefore
fi

# print key features

sleep 1

echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'Performing configuration ...')"

###
# configure apache2    
###

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

output=$(apachectl configtest 2>&1)

# Check if the output is "Syntax OK"
if [[ "$output" == "Syntax OK" ]]; then
    echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'Apache configuration is valid! 🎉')"
else
    echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'Error in Apache configuration! 😱')"
    echo "$output"
fi

apachectl restart

function testAfter() {
  rm -f /tmp/tls-configurator/testssl-after.json

  gum spin --spinner dot --title "Testing gained capabilities using testssl ..." -- testssl --jsonfile /tmp/tls-configurator/testssl-after.json localhost > /dev/null

  clear

  gum style \
  --foreground 212 --border-foreground 212 --border double \
  --align center --width 50 --margin "1 2" --padding "2 4" \
  'Gained capabilities ...'

  print_testssl_feature "ALPN" "ALPN" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "TLS1" "TLS1" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "TLS1_2" "TLS1.2" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "TLS1_3" "TLS1.3" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "banner_server" "Banner Server" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "HTTP_status_code" "HTTP Status Code" /tmp/tls-configurator/testssl-after.json

  print_testssl_feature "cert_fingerprintSHA256" "Certificate Fingerprint" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "cert_caIssuers" "Certificate Issuer" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "cert_trust" "Certificate Trust" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "cert_chain_of_trust" "Certificate Chain of Trust" /tmp/tls-configurator/testssl-after.json
  print_testssl_feature "cert_expirationStatus" "Certificate Expiration" /tmp/tls-configurator/testssl-after.json
}

testAvailability

if [[ "$https_accessible" == true ]]; then
  testAfter
else
  echo "$(gum style --foreground 'black' '>') $(gum style --bold --foreground '212' 'HTTPS still not accessible! 😱')"
fi