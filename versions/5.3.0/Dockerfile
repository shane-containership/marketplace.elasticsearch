FROM library/elasticsearch:5.3.2

MAINTAINER ContainerShip Developers <developers@containership.io>

RUN apt-get update && apt-get install dnsutils -y

ADD containership-entrypoint.sh /

ENTRYPOINT ["/containership-entrypoint.sh"]
