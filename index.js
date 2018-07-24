const cluster = require('cluster')
module.exports = cluster.isMaster ?	require('./master.js') : require('./child.js')
