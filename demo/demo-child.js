const cluster = require('cluster')
const clusterCollector = require('../child')

let port = process.env.PORT
console.log(`Worker with port ${port}. isMaster=${cluster.isMaster}`)

clusterCollector.on('stat', async function(data) {
	return {
		port: port,
		tick: tick
	}
})

let tick = 0
setInterval(() => tick++, 100);

(async function() {
	await new Promise(resolve => setTimeout(resolve, 2000))
	
	let ret = await clusterCollector.collect('stat')
	console.log('Collected from node', port, ret)
	
})().then().catch(console.error)

setTimeout(() => process.exit(0), 6000)