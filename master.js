const cluster = require('cluster')
const selfCollector = require('./child.js')

cluster.on('message', (worker, message) => {
	if (typeof message !== 'object')
		return

	//console.log('message master ', process.env.NODE_UNIQUE_ID, message)
	
	let cmd = message.cmd
	switch (cmd) {
		case 'cluster-collector.collect-node.resp':
			handledCollectNodeResp(message)
			break
		case 'cluster-collector.collect-all':
			handleCollectAll(worker, message)
			break
		default:
			return
	}
})

function handledCollectNodeResp(message) {
	let pending = pending_collectors[message.seq]
	if (!pending)
		return
	pending.add(message.data)
}

function handleCollectAll(worker, message) {
	collect(message.topic, message.options)
		.then(data => finish(null, data))
		.catch(finish)
		
	function finish(err, data) {
		let msg = {
			cmd: 'cluster-collector.collect-all.resp',
			seq: message.seq,
			topic: message.topic,
			data: data,
			error: err
		}
		
		worker.send(msg)
	}
}
	
let collector_seq = 0
let pending_collectors = {}

const DEFAULT_OPTIONS = {
	filter: worker => true,
	timeout: 10000
}

class MasterCollector {	
	constructor(topic, options, callback) {
		this.topic = topic
		this.options = Object.assign({}, DEFAULT_OPTIONS, options)
		this.callback = callback
		
		let seq = ++collector_seq
		this.seq = seq
		this.data = []
		this.requiredResponse = 0
		
		this.timer = setTimeout(() => this.finish('timeout'), this.options.timeout)
		
		pending_collectors[seq] = this
	}
	
	add(data) {
		this.data.push(data)
		if (this.data.length < this.requiredResponse)
			return
			
		this.finish()
	}
	
	start() {		
		let msg = {
			cmd: 'cluster-collector.collect-node',
			seq: this.seq,
			topic: this.topic
		}
		
		for (const i in cluster.workers) {
			let w = cluster.workers[i]
			if (this.options.filter(w)) {
				this.requiredResponse++
				w.send(msg)
			}
		}
	}
	
	finish(err) {
		clearTimeout(this.timer)
		delete pending_collectors[this.seq]
		
		this.callback(err, this.data)
	}
}
 
function collect(topic, options) {
	return new Promise((resolve, reject) => {
		let callback = (err, data) => err ? reject(err) : resolve(data)
		new MasterCollector(topic, options, callback).start()
	})
}

module.exports = {
	collect: collect,
	defaults: DEFAULT_OPTIONS,
	on: selfCollector.on
}