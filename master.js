'use strict'

const cluster = require('cluster')
const clusterCall = require('cluster-call')
const selfCollector = require('./child.js')

//register a ClusterCall handler, to support collect all from a child
clusterCall._clusterCollector_collectAll = collectFromNodes

function collectFromNodes(topic, options) {
	if (!options)
		options = {}
	
	let tasks = []
	for (const i in cluster.workers) {
		
		let w = cluster.workers[i]
		
		if (typeof options.filter === 'function' && !options.filter(w))
			continue
			
		let t = clusterCall(w)._clusterCollector_collectNode(topic, options.data)
		if (options.timeout)
			t.timeout(options.timeout)
		t.catch(e => {error: e})
		tasks.push(t)
	}
	
	if (clusterCall._clusterCollector_collectNode) {
		if (typeof options.filter !== 'function' || options.filter(w)) {
			let t = new Promise(resolve => {
				let impl = () => resolve(clusterCall._clusterCollector_collectNode(topic, options.data))
				setImmediate(impl)
			})
			tasks.push(t)
		}
	}
	
	return Promise.all(tasks)
}

module.exports = {
	collect: collectFromNodes,
	on: selfCollector.on
}