#!/bin/bash

# set static environment variables
FOLLOWERS_DNS=followers.$CS_CLUSTER_ID.containership
FOLLOWER_DNS=$(hostname).$CS_CLUSTER_ID.containership

ES_BIND_HOST=$(dig @localhost +short $FOLLOWER_DNS)
ES_CLUSTER_SIZE=$(dig @localhost +short $FOLLOWERS_DNS | wc -l)
ES_MIN_MASTER_NODES=$(expr $ES_CLUSTER_SIZE / 2 + 1)

# set dynamic environment variables
ES_CLUSTER_NAME="${ES_CLUSTER_NAME:-Containership}"
ES_HTTP_PORT="${ES_HTTP_PORT:-9200}"
ES_JAVA_OPTS="${ES_JAVA_OPTS:--Xmx512m -Xms256m}"
ES_TCP_PORT="${ES_TCP_PORT:-9300}"

# set dynamic environment variables
ES_UNICAST_HOSTS=""
for ip in $(dig @localhost +short $FOLLOWERS_DNS); do
  ES_UNICAST_HOSTS="$ES_UNICAST_HOSTS$ip,"
done

sysctl -w vm.max_map_count=262144

echo "Starting Elasticsearch with the following configuration: \
    -Ehttp.port=$ES_HTTP_PORT \
    -Etransport.tcp.port=$ES_TCP_PORT \
    -Ecluster.name=$ES_CLUSTER_NAME \
    -Enetwork.host=$ES_BIND_HOST \
    -Ediscovery.zen.minimum_master_nodes=$ES_MIN_MASTER_NODES \
    -Ediscovery.zen.ping.unicast.hosts=$ES_UNICAST_HOSTS \
    -Ebootstrap.memory_lock=false"

/docker-entrypoint.sh elasticsearch \
    -Ehttp.port=$ES_HTTP_PORT \
    -Etransport.tcp.port=$ES_TCP_PORT \
    -Ecluster.name=$ES_CLUSTER_NAME \
    -Enetwork.host=$ES_BIND_HOST \
    -Ediscovery.zen.minimum_master_nodes=$ES_MIN_MASTER_NODES \
    -Ediscovery.zen.ping.unicast.hosts=$ES_UNICAST_HOSTS \
    -Ebootstrap.memory_lock=false
