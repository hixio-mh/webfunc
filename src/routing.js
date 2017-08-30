/**
 * Copyright (c) 2017, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

/**
 * Converts a route string template to a route detail object with specific info about that route.
 * From 'users/{username}/account/{id}' to { "name": "/users/{username}/account/{id}/", "params": [ "username", "id"], "regex": {} }
 * 
 * @param  {String} route Uri path
 * @return {Object}       e.g. { "name": "/users/{username}/account/{id}/", "params": [ "username", "id"], "regex": {} }
 */
const getRouteDetails = route => {
	let wellFormattedRoute = (route.trim().match(/\/$/) ? route.trim() : route.trim() + '/')
	wellFormattedRoute = wellFormattedRoute.match(/^\//) ? wellFormattedRoute : '/' + wellFormattedRoute

	const variables = wellFormattedRoute.match(/{(.*?)}/g) || []
	const variableNames = variables.map(x => x.replace(/^{/, '').replace(/}$/, ''))
	const routeRegex = variables.reduce((a, v) => a.replace(v, '(.*?)'), wellFormattedRoute)
	const rx = new RegExp(routeRegex)

	return {
		name: wellFormattedRoute,
		params: variableNames,
		regex: rx
	}
}

/**
 * Matches a URI path against a route object (probably generated by the 'getRouteDetails' function). If it matches,
 * it returns an object containing the part that matches, as well as the map of arguments that matches. Example:
 * 		const route = getRouteDetails('users/{username}/account/{accountId}')
 *   	result = matchRoute('/users/nic/account/1/blabla', route)
 *   	// {	
 *		// 		"match": "/users/nic/account/1/",
 *		// 		"route": "/users/nic/account/1/hu",
 *		// 		"parameters": {
 *		// 			"username": "nic",
 *		// 			"accountId": "1"
 *		// 		}
 *		// }	
 * 
 * @param  {String} reqPath 		URI path (e.g. '/users/nic/account/1/blabla')
 * @param  {Object} route			Route details 
 * @param  {Array} 	route.params 	Array of variable names (e.g. ['username', 'accountId'])
 * @param  {Regex} 	route.regex  	Regex
 * @return {Object}                	null if there is no match, Object as described in the example above if it does.
 */
const matchRoute = (reqPath, { params, regex }) => {
	if (!reqPath)
		return null

	let wellFormattedReqPath = (reqPath.trim().match(/\/$/) ? reqPath.trim() : reqPath.trim() + '/').toLowerCase()
	wellFormattedReqPath = wellFormattedReqPath.match(/^\//) ? wellFormattedReqPath : '/' + wellFormattedReqPath

	const match = wellFormattedReqPath.match(regex)

	if (!match)
		return null
	else {
		const beginningBit = match[0]
		if (wellFormattedReqPath.indexOf(beginningBit) != 0)
			return null
		else {
			const parameters = (params || []).reduce((a, p, idx) => {
				a[p] = match[idx + 1]
				return a
			}, {})
			return {
				match: beginningBit,
				route: reqPath,
				parameters
			}
		}
	}
}

module.exports = {
	getRouteDetails,
	matchRoute
}