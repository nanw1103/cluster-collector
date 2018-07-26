# cluster-collector
Collect information from all nodes in a NodeJs cluster. Either from the master node, or any single worker in the cluster. 
E.g. Used by a REST service to collect cluster statistics aggregation.

# Example - Cluster master

```javascript
const cluster = require('cluster')
const clusterCollector = require('cluster-collector')

cluster.setupMaster({ exec: __dirname + '/demo-child.js' })
cluster.fork({ demo_id: 0 })
cluster.fork({ demo_id: 1 });

(async function() {
	
	//delay for demo. You may want to listen to the 'online' event in production case.
	await new Promise(resolve => setTimeout(resolve, 1000))
	
	let options = {
		//filter: worker => true,	//filter workers to collect from
		//timeout: 10000,
		data: 'hello'			//a custom object to pass on
	}
	let ret = await clusterCollector.collect('myTopic', options)
	console.log('Cluster result collected from master', ret)
	
})().catch(console.error)
```

# Example - Cluster worker


```javascript
const clusterCollector = require('cluster-collector')

let demo_id = process.env.demo_id

//Add a handler which generates data for 'myTopic'.
//The handler can be either sync or async
clusterCollector.on('myTopic', async data => data + ' ' + demo_id);

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

```


# Output

```
Cluster result collected from master [ 'hello 0', 'hello 1' ]
Cluster result collected from a child: 1 [ 'mortal 0', 'mortal 1' ]
Cluster result collected from a child: 0 [ 'mortal 0', 'mortal 1' ]
```
