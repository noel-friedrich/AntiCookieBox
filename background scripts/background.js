function setNotification(txt, color=[70, 70, 70, 128]) {
	let ba = chrome.browserAction
	ba.setBadgeBackgroundColor({color: color})
	ba.setBadgeText({text: txt + ""})
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	let ba = chrome.browserAction

    if (request.type == "cookie-notification") {
		setNotification(request.cookiesRemoved)
	}

	else if (request.type == "acb-exception") {
		setNotification("x", color=[200, 70, 70, 128])
	}

    sendResponse()
})

chrome.tabs.onActivated.addListener(() => {
	chrome.storage.local.get({
		acb_cookiesremoved: {},
		exception: ""
	}, (localData) => {
		chrome.storage.sync.get({
			acb_exceptions: []
		}, (syncData) => {
			chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
				let url = tabs[0].url
				console.log(url)
				let hostname
				try {
					hostname = new URL(url).hostname
				} catch {
					setNotification("-", color=[200, 70, 70, 128])
					return
				}
				let removedDict = localData.acb_cookiesremoved
				if (removedDict.hasOwnProperty(url)) {
					let removed = removedDict[url]
					if (removed)
						setNotification(removed)
					else if (removed == 0)
						setNotification("")
					return
				}	
	
				let exceptions = syncData.acb_exceptions
	
				for (let i = 0; i < exceptions.length; i++) {
					let exception = exceptions[i]
					if (hostname.endsWith(exception)) {
						setNotification("x", color=[200, 70, 70, 128])
						return
					}
				}
	
				if (url == localData.exception || url.startsWith("chrome://")) {
					setNotification("x", color=[200, 70, 70, 128])
					return
				}
	
				setNotification("")
			})
		})
	})
})
