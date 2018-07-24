const cluster = require('cluster')
const clusterCollector = require('../master')

cluster.setupMaster({
	exec: 'demo-child.js'
})

for (let i = 0; i < 2; i++) {
	cluster.fork({
		PORT: i
	})
};

(async function() {
	
	await new Promise(resolve => setTimeout(resolve, 4000))
	
	let options = {
		//filter: worker => true,	//filter children to collect from
		//timeout: 10000,
		//data: 'your custom obj'
	}
	let ret = await clusterCollector.collect('stat')
	console.log('Collected from master', ret)
	
})().then().catch(console.error)


