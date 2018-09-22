'use strict'

const clusterCall = require('cluster-call')

const handlerMap = {}

clusterCall._clusterCollector_collectNode = function(topic, data) {
	let h = handlerMap[topic]
	if (!h)
		return Promise.reject('Missing handler for collector topic ' + topic)
	return h(data)
}

function collectAllFromMaster(topic, options) {
	return clusterCall('master')._clusterCollector_collectAll(topic, options)
}

module.exports = {
	collect: collectAllFromMaster,
	on: (topic, handler) => handlerMap[topic] = handler
}
