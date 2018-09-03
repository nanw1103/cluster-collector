const clusterCollector = require('cluster-collector')

let demo_id = process.env.demo_id

//Add a handler which generates data for 'myTopic'.
//The handler can be either sync or async
clusterCollector.on('myTopic', async data => data + ' child ' + demo_id);

(async function() {	
	//demo delay
	await new Promise(resolve => setTimeout(resolve, 2000))
	
	let options = {
		//timeout: 10000,
		data: 'mortal'		//a custom object to pass on
	}
	
	let ret = await clusterCollector.collect('myTopic', options)
	console.log('Cluster result collected from a child:', demo_id, ret)
	
})().catch(e => console.error('error', e.toString()))
	.then(() => setTimeout(process.exit, 1000))
