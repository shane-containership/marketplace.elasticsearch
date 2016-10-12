var fs = require("fs");
var os = require("os");
var _ = require("lodash");
var async = require("async");
var dns = require("native-dns");
var child_process = require("child_process");

async.parallel({
    ELASTICSEARCH_HOST: function(fn){
        var question = dns.Question({
          name: [os.hostname(), process.env.CS_CLUSTER_ID, "containership"].join("."),
          type: "A"
        });

        var req = dns.Request({
            question: question,
            server: { address: "127.0.0.1", port: 53, type: "udp" },
            timeout: 2000
        });

        req.on("timeout", function(){
            return fn();
        });

        req.on("message", function (err, answer) {
            var addresses = [];
            answer.answer.forEach(function(a){
                addresses.push(a.address);
            });

            return fn(null, _.first(addresses));
        });

        req.send();
    },
    ELASTICSEARCH_UNICAST_HOSTS: function(fn){
        if(_.has(process.env, "ELASTICSEARCH_UNICAST_HOSTS"))
            return fn(null, process.env.ELASTICSEARCH_UNICAST_HOSTS);

        var question = dns.Question({
          name: ["followers", process.env.CS_CLUSTER_ID, "containership"].join("."),
          type: "A"
        });

        var req = dns.Request({
            question: question,
            server: { address: "127.0.0.1", port: 53, type: "udp" },
            timeout: 2000
        });

        req.on("timeout", function(){
            return fn();
        });

        req.on("message", function (err, answer) {
            var addresses = [];
            answer.answer.forEach(function(a){
                addresses.push(a.address);
            });

            return fn(null, addresses.join(","));
        });

        req.send();
    }
}, function(err, elasticsearch){
    _.merge(elasticsearch, process.env);

    _.defaults(elasticsearch, {
        ELASTICSEARCH_DATA_PATH: "/data",
        ELASTICSEARCH_LOGS_PATH: "/data",
        ELASTICSEARCH_HTTP_PORT: "9200",
        ELASTICSEARCH_TCP_PORT: "9300",
        ELASTICSEARCH_CLUSTER_NAME: "ContainerShip",
        ELASTICSEARCH_BIND_HOST: "0.0.0.0",
        ELASTICSEARCH_PLUGINS: ""
    });

    var options = [
        ["-Des.path.data", [elasticsearch.ES_HOME, elasticsearch.ELASTICSEARCH_DATA_PATH].join("")].join("="),
        ["-Des.path.logs", [elasticsearch.ES_HOME, elasticsearch.ELASTICSEARCH_LOGS_PATH].join("")].join("="),
        ["-Des.http.port", elasticsearch.ELASTICSEARCH_HTTP_PORT].join("="),
        ["-Des.transport.tcp.port", elasticsearch.ELASTICSEARCH_TCP_PORT].join("="),
        ["-Des.cluster.name", elasticsearch.ELASTICSEARCH_CLUSTER_NAME].join("="),
        ["-Des.network.host", elasticsearch.ELASTICSEARCH_HOST].join("="),
        ["-Des.discovery.zen.minimum_master_nodes", Math.floor(elasticsearch.ELASTICSEARCH_UNICAST_HOSTS.split(",").length/2) + 1].join("="),
        ["-Des.discovery.zen.ping.unicast.hosts", elasticsearch.ELASTICSEARCH_UNICAST_HOSTS].join("=")
    ]

    async.each(elasticsearch.ELASTICSEARCH_PLUGINS.split(","), function(plugin, fn){
        if(plugin === "") {
            return fn();
        }

        child_process.exec([[elasticsearch.ES_HOME, "bin", "plugin"].join("/"), "--install", plugin].join(" "), function(err, stdout, stderr){
            console.log(err);
            console.log(stdout);
            console.log(stderr);
            return fn();
        });
    }, function(){
        child_process.spawn([elasticsearch.ES_HOME, "bin", "elasticsearch"].join("/"), options, {
            stdio: "inherit"
        }).on("error", function(err){
            process.stderr.write(err);
        });
    });
});
