const cluster = require('cluster')
const clusterCollector = require('../index.js')
const path = require('path')

cluster.setupMaster({ exec: path.resolve(__dirname, 'demo-child.js') })
cluster.fork({ demo_id: 0 })
cluster.fork({ demo_id: 1 })

//OPTIONALLY, you can attach event handler on master node so as to collect from master node as well.
clusterCollector.on('myTopic', async data => data + ' master');

(async function() {

	//delay for demo. You may want to listen to the 'online' event in production case.
	await new Promise(resolve => setTimeout(resolve, 1000))

	let options = {
		//filter: worker => true,	//filter workers to collect from
		//timeout: 10000,
		//excludeMaster: false,		//whether collect from master node or not
		data: 'hello'				//a custom object to pass on
	}
	let ret = await clusterCollector.collect('myTopic', options)
	console.log('Cluster result collected from master', ret)

})().catch(e => console.error('error', e))
