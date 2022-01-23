function Lucy() {

	// SET SELECTED LUCY

	let lucy_images = [
		"ghost-3.png",
		"ghost-4.png",
		"ghost-5.png",
		"ghost-6.png",
		"ghost-7.png",
		"ghost-8.png",
		"ghost-9.png",
		"ghost-10.png",
		"ghost-11.png",
		"ghost-12.png",
		"ghost-13.png",
		"ghost-14.png",
		"ghost-15.png",
		"ghost-16.png"
	]
	
	function getRandomInt(min, max) {
		min = Math.ceil(min)
		max = Math.floor(max)
		return Math.floor(Math.random() * (max - min + 1)) + min
	}
	
	function setCorrectLucy(lucyIndex) {
		if (!(lucyIndex < lucy_images.length))
			lucyIndex = getRandomInt(0, lucy_images.length - 1)
		let img_src = "lucy-imgs/" + lucy_images[lucyIndex]
		document.getElementById("lucy").setAttribute("src", img_src)
	}

	chrome.storage.sync.get({
		acb_lucy: 0
	}, function(items) {
		setCorrectLucy(items.acb_lucy)
	})

	// ATTRIBUTES

	this.boxCounts = new Promise((resolve, reject) => {
		chrome.storage.local.get({
			acb_cookiesremoved: {}
		}, (data) => resolve(data.acb_cookiesremoved))
	})

	this.tab_url = new Promise((resolve, reject) => {
		chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		}, (tabs) => resolve(tabs[0].url))
	})

	this.settings = new Promise((resolve, reject) => {
		chrome.storage.sync.get({
			acb_exceptions: [],
			acb_mode: "normal"
		}, (data) => resolve({
			exceptions: data.acb_exceptions,
			mode: data.acb_mode
		}))
	})

	this.active = new Promise((resolve, reject) => {
		chrome.storage.local.get({
			ACB_ACTIVE: true
		}, (data) => resolve(data.ACB_ACTIVE))
	})
	
	this.localException = new Promise((resolve, reject) => {
		chrome.storage.local.get({
			exception: ""
		}, (data) => resolve(data.exception))
	})

	this.say = (text) => {
		let bubble = document.getElementById("speechbubble")
		bubble.textContent = text
	}

	this.setAddException = (state="none") => {
		document.getElementById("add-exception-btn").style.display = state
	}

	this.setReverseButton = (state="none") => {
		document.getElementById("reverse-changes-btn").style.display = state
	}

	this.setRedoButton = (state="none") => {
		document.getElementById("redo-changes-btn").style.display = state
	}

	this.setAddedException = (state="none") => {
		document.getElementById("open-settings-btn").style.display = state
	}

	this.setReportButton = (state="none") => {
		document.getElementById("report-error-btn").style.display = state
	}

}

let lucy = new Lucy()

async function refreshLucy() {

	lucy.say("I haven't been able to fight here (yet)")
	lucy.setAddedException(state="none")

	let boxCounts = await lucy.boxCounts

	let url = await lucy.tab_url
	let hostname = url
	try {
		hostname = new URL(url).hostname
	} catch (e) {
		lucy.setAddException(state="none")
	}

	// if url is a chrome url
	if (url.startsWith("chrome")) {
		lucy.say("I don't want to fight with chrome")
		lucy.setAddException(state="none")
		lucy.setReverseButton(state="none")
		lucy.setRedoButton(state="none")
		lucy.setAddedException(state="none")
		lucy.setReportButton(state="none")
		return
	}

	let boxCount = boxCounts[url]

	switch(boxCount) {
		case undefined:
			break
		case 0:
			lucy.say(`I didn't find any boxes on this website`)
			lucy.setReverseButton(state="none")
			break
		case 1:
			lucy.say(`I have scared 1 Cookie Box off!`)
			lucy.setReverseButton(state="block")
			break
		default:
			lucy.say(`I have scared ${boxCount} Cookie Boxes off!`)
			lucy.setReverseButton(state="block")
	}

	let settings = await lucy.settings

	for (let i = 0; i < settings.exceptions.length; i++) {
		let exception = settings.exceptions[i]
		if (hostname.endsWith(exception)) {
			lucy.say("You added an exception to this site")
			lucy.setAddException(state="none")
			lucy.setReverseButton(state="none")
			lucy.setRedoButton(state="none")
			lucy.setAddedException(state="block")
		}
	}

	let localException = await lucy.localException

	if (localException == url) {
		lucy.say("You have reversed my actions here")
		lucy.setReverseButton(state="none")
		lucy.setRedoButton(state="block")
	} else {
		lucy.setRedoButton(state="none")
	}

}

function reverse() {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		chrome.storage.local.set({exception: tabs[0].url})
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.reload(tabs[0].id)
			window.close()
	    })
	})
}

function reverse_back() {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		chrome.storage.local.set({exception: ""})
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.reload(tabs[0].id);
			window.close();
	    })
	})
}

function openSettings() {
	chrome.tabs.create({'url': "/options.html" } )
}

function addException(exception) {
	chrome.storage.sync.get({
		acb_exceptions: []
    }, function(items) {
		let curr_exceptions = items.acb_exceptions
		curr_exceptions.push(exception)
		chrome.storage.sync.set({
			acb_exceptions: curr_exceptions
		}, function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.reload(tabs[0].id)
				window.close()
			})
		})
    })
}

function addPermanentException() {
	chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
		let url = tabs[0].url
		let domain = (new URL(url))
		domain = domain.hostname
		domain = psl.parse(domain).domain
		if (domain != null)
			addException(domain)
	})
}

function reportError() {
	chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
		let activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, {type: "report"});
	})
	window.close()
}

refreshLucy()

document.getElementById("add-exception-btn").addEventListener('click', addPermanentException)
document.getElementById("settings").addEventListener('click', openSettings)
document.getElementById("open-settings-btn").addEventListener('click', openSettings)
document.getElementById("reverse-changes-btn").addEventListener('click', reverse)
document.getElementById("redo-changes-btn").addEventListener('click', reverse_back)
document.getElementById("report-error-btn").addEventListener('click', reportError)