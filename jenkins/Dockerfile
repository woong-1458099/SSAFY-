FROM jenkins/jenkins:lts

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git docker.io \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/java/openjdk && \
    curl -fsSL "https://api.adoptium.net/v3/binary/latest/25/ga/linux/x64/jdk/hotspot/normal/eclipse" -o /tmp/jdk25.tar.gz && \
    tar -xzf /tmp/jdk25.tar.gz --strip-components=1 -C /opt/java/openjdk && \
    rm -f /tmp/jdk25.tar.gz

ENV JAVA_HOME=/opt/java/openjdk
ENV PATH=/opt/java/openjdk/bin:${PATH}

RUN java -version

USER jenkins
