FROM node:22.11-alpine3.20 AS builder

LABEL org.opencontainers.image.authors="sebastian.raubach@hutton.ac.uk"
LABEL org.opencontainers.image.url="https://ics.hutton.ac.uk/get-gridscore/"
LABEL org.opencontainers.image.documentation="https://cropgeeks.github.io/gridscore-next-client"

ARG BRANCH=master

# Force docker to not cache the next line
ADD https://api.github.com/repos/cropgeeks/gridscore-next-client/git/refs/heads/main version.json
# Clone the GridScore server code and client code
RUN echo "Pulling GitHub branch: $BRANCH"
RUN apk add --no-cache git && \
    if [ "$BRANCH" = "master" ] || [ "$BRANCH" = "vue3" ] ; then git clone -b "main" --single-branch --depth 1 https://github.com/cropgeeks/gridscore-next-server.git /opt/gridscore-server ; else git clone -b "$BRANCH" --single-branch --depth 1 https://github.com/cropgeeks/gridscore-next-server.git /opt/gridscore-server ; fi && \
    if [ "$BRANCH" = "master" ] ; then git clone -b "main" --single-branch --depth 1 https://github.com/cropgeeks/gridscore-next-client.git /opt/gridscore-client ; else git clone -b "$BRANCH" --single-branch --depth 1 https://github.com/cropgeeks/gridscore-next-client.git /opt/gridscore-client ; fi

# Build the client code
WORKDIR /opt/gridscore-client
RUN rm -f .env && \
    echo "VUE_APP_BASE_URL=./api/" > .env && \
    apk add --no-cache python3 build-base gcc wget && \
    npm i && \
    npm run build && \
    mkdir /opt/gridscore-server/client/ && \
    cp -a /opt/gridscore-client/dist/. /opt/gridscore-server/client/

# Download Gradle and build the server code
RUN apk add --no-cache openjdk21 && \
    wget https://services.gradle.org/distributions/gradle-8.8-bin.zip -P /tmp/ && \
    unzip /tmp/gradle-8.8-bin.zip -d /opt/ && \
    echo "config.folder=/data/gridscore" > /opt/gridscore-server/config.properties && \
    echo "project.name=gridscore" >> /opt/gridscore-server/gradle.properties && \
    /opt/gradle-8.8/bin/gradle -p /opt/gridscore-server war


FROM tomcat:10.1-jdk21

LABEL org.opencontainers.image.authors="sebastian.raubach@hutton.ac.uk"
LABEL org.opencontainers.image.url="https://ics.hutton.ac.uk/get-gridscore/"
LABEL org.opencontainers.image.documentation="https://cropgeeks.github.io/gridscore-next-client"

RUN apt-get update && \
    apt-get --yes --force-yes install unzip zip && \
    # Obscuring server info
    cd ${CATALINA_HOME}/lib && \
    mkdir -p org/apache/catalina/util/ && \
    unzip -j catalina.jar org/apache/catalina/util/ServerInfo.properties -d org/apache/catalina/util/ && \
    sed -i 's/server.info=.*/server.info=Apache Tomcat/g' org/apache/catalina/util/ServerInfo.properties && \
    zip -ur catalina.jar org/apache/catalina/util/ServerInfo.properties && \
    rm -rf org && cd ${CATALINA_HOME} && \
    # Add a default error page mapping to hide the exception message
    sed -i 's/<\/web-app>/    <error-page>\n        <exception-type>java.lang.Throwable<\/exception-type>\n        <location>\/dev\/null<\/location>\n    <\/error-page>\n<\/web-app>/g' conf/web.xml && \
    sed -i 's/<\/Host>/  <Valve className="org.apache.catalina.valves.ErrorReportValve" showReport="false" showServerInfo="false" \/>\n      <\/Host>/g' conf/server.xml

RUN mkdir -p /usr/local/tomcat/webapps && \
    rm -rf /usr/local/tomcat/webapps/ROOT

COPY --from=builder /opt/gridscore-server/build/libs/gridscore-*.war /usr/local/tomcat/webapps/ROOT.war

WORKDIR /usr/local/tomcat/
