FROM itzg/ubuntu-openjdk-7

MAINTAINER ContainerShip Developers <developers@containership.io>

# set environment variables
ENV ES_VERSION 1.7.0
ENV ES_HOME /usr/share/elasticsearch-$ES_VERSION

# install dependencies
RUN apt-get update
RUN apt-get install wget npm -y
RUN wget -qO /tmp/es.tgz https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-$ES_VERSION.tar.gz \
  && cd /usr/share \
  && tar xf /tmp/es.tgz \
  && rm /tmp/es.tgz

# add elasticsearch user
RUN useradd -d $ES_HOME -M -r elasticsearch && chown -R elasticsearch: $ES_HOME

# install npm & node
RUN npm install -g n
RUN n 0.10.38

# create /app and add files
WORKDIR /app
ADD . /app

# install dependencies
RUN npm install

# set user
USER elasticsearch

# expose ports
EXPOSE 9200 9300

# Execute the run script in foreground mode
CMD node elasticsearch.js
