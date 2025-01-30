# TLS Configurator

This project is aimed to provide a simple way to configure a TLS certificate for web servers. Certificate pairs can be provided and be fed into the web server configuration.

## Testing

The project is tested against a docker compoose environment running apache2. The server will spin up without tls/ssl configuration and serve a basic web page available on 127.0.0.1:8080. The server can be configured to use the provided certificate pair.

```bash
sudo docker compose up -d --build --force-recreate
```

Generating a sample certificate pair can be done with the following command:

```bash
openssl req -x509 -newkey rsa:4096 -keyout demo-crt/key.pem -out demo-crt/cert.pem  -sha256 -days 3650 -nodes -subj "/C=DE/ST=Rhineland-Palatinate/L=SampleCity/O=SampleOrganization/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"
```

We need to make sure [Subject Alternative Names](https://stackoverflow.com/a/66839523/13353068) are given. Browsers won't trust the certificate, because it was not issued by a trusted CA.

We can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a locally trusted certificate. The following command will generate a certificate pair for localhost:

mkcert -key-file demo-crt/key.pem -cert-file demo-crt/cert.pem localhost 127.0.0.1 ::1

````bash


### Common file types

![Application to X.509 Certificate](https://i.sstatic.net/Ku0lg.png)

```plaintext
- .der -> binary encoded
- .pem -> base64 encoded
- .crt -> could be DER or PEM, means it is the public key (difference might not be clear by just checking file extension)
- .key / key.pem -> private key
````

[Read more at the Apache HTTP Server documentation](https://httpd.apache.org/docs/2.4/ssl/ssl_faq.html#aboutcerts).

Make sure to run the `install.sh` script inside the container using `docker exec -it tls-configurator-apache /usr/local/apache2/install.sh`.

You can enter the container using `docker exec -it tls-configurator-apache /bin/bash`.

The certificate is automatically installed in the container and the server is restarted.

You can check the page at [https://localhost:8443](https://localhost:8443). The certificate should be trusted by the browser.

![Trusted certificate](assets/installed-certificate.png)

# Building binaries

deno run build

# Running the tests

cd ./tests && docker compose up -d
docker exec tls-configurator-apache mkdir -p /tmp/make-secure
docker cp bin/ tls-configurator-apache:/tmp/make-secure
docker exec -it tls-configurator-apache /bin/bash
./tmp/make-secure/linux/arm64/make-secure (on arm64 platform)