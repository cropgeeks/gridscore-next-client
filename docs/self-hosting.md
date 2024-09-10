---
title: GridScore NEXT Self-hosting GridScore
---

<a href="index.html" class="btn btn-dark">Home</a>

# Self-hosting GridScore

While GridScore is completely free to use, the trial sharing mechanism uses our servers to synchronize the data. For some users, having their data on someone else's server may not be an option. For those cases, self-hosting GridScore offers an alternative where your data will always stay on your servers.

## Requirements

To self-host GridScore, you will need to be able to host a [Docker](https://www.docker.com/) container on your premises or in the cloud. The GridScore Docker image is available on [Docker Hub](https://hub.docker.com/r/cropgeeks/gridscore-next).

## Setup

An example `docker-compose.yml` file is shown below.
```yaml
version: '3.3'
services:
  tomcat:
    image: cropgeeks/gridscore-next:<VERSION>
    environment:
      - JAVA_OPTS:-Xmx256m
    ports:
      - <PORT>:8080
    volumes:
      - type: bind
        source: ./config
        target: /data/gridscore
      - type: volume
        source: gridscore-next
        target: /usr/local/tomcat/temp
    restart: unless-stopped
    container_name: gridscore-next

volumes:
  gridscore-next:
```

Place this file in a folder on your server. Make sure to adjust `<PORT>` amd `<VERSION>`. The version is of the form `vX.X.X` and can be looked up on Docker Hub.

Additionally, create a `config` directory in the same location and place a `config.properties` file in it.

```ini
# Options for the database connection
database.server=<Database server IP>
database.name=<Database name on server>
database.username=<Database username with access to database>
database.password=<Database password for this user>

trial.expiry.days=<Number of days after which inactive trials are archived>

# Options for user logging (remove if not used)
plausible.hash.mode=true
plausible.domain=<URL of your GridScore location>
plausible.api.host=<Domain of your Plausible instance>

# Additional security token (remove if not used)
secure.token=<Optional token that needs to be provided for all server connections>
```

### Database information
Depending on whether you have your own central MySQL database server, you may have to run a MySQL Docker container alongside GridScore. In this case, extend the `docker-compose.yml` to look more like this:

```yml
version: '3.3'
services:
  tomcat:
    image: cropgeeks/gridscore-next:<VERSION>
    environment:
      - JAVA_OPTS:-Xmx256m
    ports:
      - <PORT>:8080
    volumes:
      - type: bind
        source: ./config
        target: /data/gridscore
      - type: volume
        source: gridscore-next
        target: /usr/local/tomcat/temp
    restart: unless-stopped
    container_name: gridscore-next
    depends_on:
      - "gridscore_mysql"

  gridscore_mysql:
    image: mysql:5.7
    # We're exposing the MySQL port for remote access at 9306
    ports:
      - <MYSQL_PORT>:3306
    volumes:
      - type: volume
        source: gridscore-mysql
        target: /var/lib/mysql/
    environment:
      # The root password. This is not used by GridScore, but can be used to access the database externally
      MYSQL_ROOT_PASSWORD: gridscore
      # The name of the GridScore database, e.g. "gridscore". Use this for 'database.name'.
      MYSQL_DATABASE: gridscore
      # The username GridScore will use to connect to this database. Use this for 'database.username'.
      MYSQL_USER: gridscore-username
      # The password GridScore will use to connect to this database. Use this for 'database.password'.
      MYSQL_PASSWORD: gridscore-password
    restart: unless-stopped
    # This is the name of the container. It's also what has to be used when trying to access the database from GridScore, e.g. 'database.server'
    container_name: gridscore_mysql

volumes:
  gridscore-next:
  gridscore-mysql:
```

Make the same adjustments as listed above and set the `<MYSQL_PORT>` in addition. Adjust `config.properties` according to the settings you chose in the MySQL Docker `environment` variables.

If you have your own central MySQL server, create a new empty database and user credentials and place them in the `config.properties` file. Ensure the MySQL server is reachable from the location you're trying to run GridScore from.

### Proxy

It's likely that your application will be running behind a proxy like Apache of nginx. Please consult their respective documentation to see how you can proxy traffic through to the Docker images on their specified ports.

For Apache, this'll include settings that look something like this:

```
ProxyPass           /               http://<DOCKERHOST>:<PORT>/
ProxyPassReverse    /               http://<DOCKERHOST>:<PORT>/
```

using the port specified in `docker-compose.yml`.

For nginx, it'll look something like this:

```
location / {
  proxy_pass http://<DOCKERHOST>:<PORT>/;
}
```

## Added security via secure token

When self-hosting, an additional security token can be set. This token will have to be specified in GridScore when sharing, synchronizing or exporting a trial and it's globally defined for the whole GridScore server, not per trial.

## Notes

Please note, that it's still possible to use the main GridScore app (the native Android app or the official website) with your self-hosted instance of the GridScore server. You'll only have to ensure you specify your remote server when GridScore asks you to share or import a trial.

Alternatively, you can just use the web version of GridScore that comes bundled with your self-hosted GridScore server.

<a href="index.html" class="btn btn-dark">Home</a>