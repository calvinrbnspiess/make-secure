# TLS Configurator

This project is aimed to provide a simple way to configure a TLS certificate for web servers. Certificate pairs can be provided and be fed into the web server configuration.

## Testing

The project is tested against a docker compoose environment running apache2. The server will spin up without tls/ssl configuration and serve a basic web page available on 127.0.0.1:8080. The server can be configured to use the provided certificate pair.

```bash
sudo docker compose up -d --build --force-recreate
```

Generating a sample certificate pair can be done with the following command:

```bash
openssl req -x509 -newkey rsa:4096 -keyout demo-crt/key.pem -out demo-crt/cert.pem -sha256 -days 3650 -nodes -subj "/C=DE/ST=Rhineland-Palatinate/L=SampleCity/O=SampleOrganization/CN=localhost"
```

Make sure to run the `install.sh` script inside the container using `docker exec -it tls-configurator-apache /usr/local/apache2/install.sh`.
