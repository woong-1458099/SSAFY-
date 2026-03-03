FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates tar gzip \
    && rm -rf /var/lib/apt/lists/*

# Install Temurin JDK 25 for Gradle toolchain builds.
RUN mkdir -p /opt/jdks \
    && curl -fsSL "https://api.adoptium.net/v3/binary/latest/25/ga/linux/x64/jdk/hotspot/normal/eclipse" -o /tmp/jdk25.tar.gz \
    && tar -xzf /tmp/jdk25.tar.gz -C /opt/jdks \
    && rm -f /tmp/jdk25.tar.gz \
    && ln -s /opt/jdks/jdk-* /opt/jdk-25

# Keep Jenkins runtime JDK unchanged, but expose JDK 25 for builds/toolchains.
ENV JDK25_HOME=/opt/jdk-25
ENV ORG_GRADLE_JAVA_INSTALLATIONS_PATHS=/opt/jdk-25

USER jenkins
