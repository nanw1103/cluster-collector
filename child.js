const cluster = require('cluster')

let collector_seq = 0

process.on('message', (message) => {
	if (typeof message !== 'object')
		return

	//console.log('message child', process.env.NODE_UNIQUE_ID, message)
	
	let cmd = message.cmd
	switch (cmd) {
		case 'cluster-collector.collect-node':
			handleCollectNode(message)
			break
		case 'cluster-collector.collect-all.resp':
			handleCollectAllResp(message)
			break
		default:
			return
	}
})

function handleCollectNode(message) {
	
	let topic = message.topic
	let h = handlerMap[topic]
	if (!h) {
		console.log('Missing handler for topic', topic)
		return
	}

	let ret = h(message.data)
	if (ret instanceof Promise) {
		ret.then(data => finish(null, data))
			.catch(finish)
	} else {
		finish(null, ret)
	}
	
	function finish(err, data) {
		let resp = {
			cmd: 'cluster-collector.collect-node.resp',
			topic: topic,
			seq: message.seq,
			data: data,
			error: err
		}
		process.send(resp)
	}
}

function handleCollectAllResp(message) {
	let callback = pending_collectors[message.seq]
	if (!callback)
		return
	callback(message.error, message.data)
}

const DEFAULT_OPTIONS = {
	timeout: 10000
}

const pending_collectors = {}

function collectAllFromMaster(topic, options) {
	options = Object.assign({}, options, DEFAULT_OPTIONS)
	let data = options.data
	delete options.data
	
	let seq = process.env.NODE_UNIQUE_ID + '-' + (++collector_seq)
	
	let msg = {
		cmd: 'cluster-collector.collect-all',
		seq: seq,
		topic: topic,
		data: options.data,
		options: options
	}

	return new Promise((resolve, reject) => {
		let callback = (err, data) => err ? reject(err) : resolve(data)
		pending_collectors[seq] = callback
		process.send(msg)
	})
}

const handlerMap = {}

module.exports = {
	collect: collectAllFromMaster,
	on: (topic, handler) => handlerMap[topic] = handler
}
