let LUCY_IMAGES = [
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

let ANIMATION_ACTIVE = false

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

let standardOptions = {

	keywords: {

		ignore: [
			"ffcbox"
		],
	
		aggressive: [
			"popup", "consent_c", "cookie",
			"privacy", "onetrust", "cbox",
			"consent", "usercentrics", "cmpbox",
			"cc_banner", "cc_container", "uc-container",
			"dataprotection", "overlay", "qc-cmp2",
			"dismissible", "econda-pp2", "gdpr",
			"truste", "cklb", "chakra-modal__overlay",
			"modal-backdrop", "popup"
		],
	
		standard: [
			"consent_c", "cookie", "cvcm-consent",
			"cookie-consent", "onetrust", "truste",
			"usercentrics", "cmpbox", "cc_banner",
			"cc_container", "uc-container", "dataprotection",
			"qc-cmp2", "alert-dismissible", "econda-pp2",
			"gdpr", "cklb", "sp_message_container",
			"chakra-modal__overlay","modal-backdrop"
		],
	
		peaceful: [
			"onetrust", "cbox", "usercentrics",
			"cmpbox", "cc_banner", "cc_container",
			"uc-container", "dataprotection"
		]
	},

	exceptions: [
		"google.com",
		"live.com",
		"microsoft.com",
		"paypal.com",
		"facebook.com"
	],

	mode: "normal",

	relevantTags: [
		"div", "form", "iframe", "section", 
		"dialog", "aside", "article"
	],

	timeIntervals: [
		100, 200, 300, 500, 750,
		1000, 2000, 3000, 4000, 5000
	],

	lucy: LUCY_IMAGES[0],

	lucyAnimation: true
}

cookieMentions = 0
cookiesRemoved = 0
removedElements = []

options = {
	messagePrefix: "[AntiCookieBox-Plugin] ",
	keyWords: standardOptions.keywords.standard,
	relevantTags: standardOptions.relevantTags,
	timeIntervals: standardOptions.timeIntervals,
	threashold: 10,
	multipliers: {
		textContent: 3.5,
		attributes: 10,
		popup: 10
	},
	mode: standardOptions.mode,
	scanText: false
}

// VARIABLES END

function getRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getSyncStorage() {
	return new Promise(resolve => {
		chrome.storage.sync.get({
			acb_mode: standardOptions.mode,
			acb_exceptions: standardOptions.exceptions,
			acb_keywords: Array(),
			acb_scrolllock: true,
			acb_lucy: 0,
			acb_lucyanimation: true,
			acb_scan_text: false
		}, function(items) {
			resolve(items)
		})
	})
}

async function getLocalStorage() {
	return new Promise(resolve => {
		chrome.storage.local.get({
			acb_cookiesremoved: {},
			exception: "",
			ACB_ACTIVE: true,
			solutions: {data: {}, lastUpdate: 0}
		}, function(items) {
			resolve(items)
		})
	})
}

async function setLocalStorage(key, value) {
	return new Promise(resolve => {
		chrome.storage.local.set({
			[key]: value
		}, function() {
			resolve()
		})
	})
}

function saveCookiesRemoved(url, num) {
	chrome.storage.local.get({
		acb_cookiesremoved: {}
	}, (data) => {
		let dictData = data.acb_cookiesremoved
		dictData[url] = num
		chrome.storage.local.set({
			acb_cookiesremoved: dictData
		})
	})
}

function getOrderedElements() {
	let allElements = document.getElementsByTagName('*')
	let sortedByDepth = []
	for(let i = 0; i < allElements.length; i++) {
	    let allChildren = allElements[i].children
	    for(let j = 0; j < allChildren.length; j++) {
	        sortedByDepth = sortedByDepth.concat(allChildren[j])
	    }
	}
	return sortedByDepth
}

function removeScrollLock() {
	if(document.body.style.overflow == "hidden" || document.body.style.overflow == "") {
		document.body.style.overflow = "auto"
		cookieLog(`Removed Scroll Lock On Body Element Using The Overflow Property`)
	}
	if(document.body.style.position == "fixed") {
		document.body.style.position = ""
		cookieLog(`Removed Scroll Lock On Body Element Using The Position Property`)
	}

	if(document.documentElement.style.overflow == "hidden") {
		document.documentElement.style.overflow = "auto"
		cookieLog(`Removed Scroll Lock On Html Element Using The Overflow Property`)
	}
	if(document.documentElement.style.position == "fixed") {
		document.documentElement.style.position = ""
		cookieLog(`Removed Scroll Lock On Html Element Using The Position Property`)
	}

	htmlClasses = document.documentElement.classList
	for (let i = 0; i < htmlClasses.length; i++) {
		classVal = htmlClasses[i]
		if (classVal.countSubString("sp-message") > 0) {
			document.documentElement.classList.remove(classVal)
			cookieLog(`Removed Scroll Lock Class From Html Element`)
		}
	}

	document.body.style.opacity = "1"
}

function sendRuntimeMessage(message) {
	chrome.runtime.sendMessage({
		message: message
	})
}

function createElement(tag, className="", innerHTML="") {
	let element = document.createElement(tag)
	element.className = className
	element.innerHTML = innerHTML
	return element
}

String.prototype.countSubString = function (subString) {
	return this.split(subString).length - 1
}

String.prototype.removeKeywords = function (keywords) {
	let target = this
	for (let i = 0; i < keywords.length; i++) {
		let keyword = keywords[i]
		target = target.split(keyword).join("")
	}
	return target
}

async function reportURL(url) {
	return new Promise(async resolve => {
		let api = "https://www.noel-friedrich.de/anticookiebox/report.php"
		await fetch(api + `?url=${encodeURIComponent(url)}`, {
			method: "GET"
		})
		resolve()
	})
}

async function requestSolutions() {
	let api = "https://www.noel-friedrich.de/anticookiebox/solutions.php"
	let response = await fetch(api)
	return response.json()
}

function getAttributeString(element) {
	let attrs = element.attributes
	let outString = ""
	for (let i = 0; i < attrs.length; i++) {
		if (attrs[i].value.length < 100)
			outString += attrs[i].value
	}
	outString += element.className
	return outString
}

function getRealTextContent(element) {
	let text = ''
	for (let i = 0; i < element.childNodes.length; ++i)
	  	if (element.childNodes[i].nodeType === Node.TEXT_NODE)
	    	text += element.childNodes[i].textContent
	return text
}

function getRelevantElements() {
	let orderedElements = getOrderedElements()
	return orderedElements.filter(element => {
		let tag = element.tagName.toLowerCase()
		return options.relevantTags.includes(tag)
	})
}

function cookieLog(message, ...args) {
	console.log(options.messagePrefix + message, ...args)
}

// UTILITY FUNCTIONS END

async function getSolutions() {
	return new Promise(async resolve => {
		let localStorage = await getLocalStorage()
		let solutions = localStorage.solutions
		let timeDiff = Date.now() - solutions.lastUpdate
		let solutionData = solutions.data
		if (!solutions.lastUpdate || timeDiff > DAY_IN_MILLISECONDS) {
			let hours = timeDiff / (1000 * 60 * 60)
			cookieLog(`Setting New Solutions [Last Update: ${hours} hours ago]`)
			solutionData = await requestSolutions()
			let newSolution = {
				lastUpdate: Date.now(),
				data: solutionData
			}
			await setLocalStorage("solutions", newSolution)
		}
		resolve(solutionData)
	})
}

function scoreElement(element) {
	let scoreCounter = 0

	if (options.scanText) {
		// check occurances of keywords in textContent
		let textContent = getRealTextContent(element).toLowerCase()
		for (let i = 0; i < options.keyWords.length; i++) {
			let keyword = options.keyWords[i].toLowerCase()
			let occurances = textContent.countSubString(keyword)
			scoreCounter += (occurances * options.multipliers.textContent)
		}
	}

	// check occurances of keywords in attributes
	let attributeString = getAttributeString(element)
						  .toLowerCase()
						  .removeKeywords(standardOptions.keywords.ignore)

	for (let i = 0; i < options.keyWords.length; i++) {
		let keyword = options.keyWords[i].toLowerCase()
		let occurances = attributeString.countSubString(keyword)
		scoreCounter += (occurances * options.multipliers.attributes)
	}

	return scoreCounter
}

function addStyle(styleText) {
	let style = document.createElement("style")
	style.appendChild(document.createTextNode(styleText))
	let head = document.head || document.getElementsByTagName('head')[0]
	head.appendChild(style)
}

function createReportPopup() {
	// if body already contains popup, remove it
	let popupElement = document.body.querySelector(".acb-popup")
	if (popupElement) {
		body.removeChild(popupElement)
	}

	addStyle(`
		.acb-popup {
			position: fixed !important;
			top: calc(50% - 200px);
			left: calc(50% - 150px);
			width: 300px !important;
			z-index: 2147483647 !important;
			background: #f9f9f9 !important;
			border: 1px solid black !important;
			border-radius: 5px !important;
			color: black !important;
		}

		.acb-popup-header {
			font-weight: bold;
			box-sizing: border-box;
			width: 100%;
			border-radius: 5px 5px 0 0;
			border-bottom: 1px solid black;
			background: #eee !important;
			text-align: left;
			padding: 10px;
			cursor: move;
			user-select: none;
			font-size: 18px;
		}

		.acb-popup-remove-x {
			position: absolute;
			top: 10px;
			right: 10px;
			color: red !important;
			cursor: pointer;
			font-family: 'Courier New', Courier, monospace;
		}

		.acb-popup-content {
			box-sizing: border-box;
			width: 100%;
			padding: 10px;
		}

		.acb-popup-url-input {
			width: 100%;
			max-width: 100%;
			padding: 10px;
			border: 1px solid black;
			border-radius: 5px;
			background: white !important;
			box-sizing: border-box;
		}

		.acb-popup-label {
			font-weight: normal !important;
			font-style: italic !important;
			display: block;
			text-align: center;
		}

		.acb-popup-button {
			cursor: pointer;
			display: block;
			width: 100%;
			padding: 10px;
			border: 1px solid black;
			border-radius: 5px;
			background: #eee;
			text-align: center;
			margin-top: 10px;
		}

		.acb-popup-button:hover {
			background: #f2d6d6;
		}

		.acb-info-box {
			box-sizing: border-box;
			padding: 10px;
			border: 1px solid black;
			border-radius: 5px;
			margin-top: 10px;
			background: #fae54b !important;
			color: black !important;
		}
	`)
	let popup = createElement("div", "acb-popup")
	let header = createElement("div", "acb-popup-header", "AntiCookieBox: Report Error")
	let removeX = createElement("span", "acb-popup-remove-x", "X")
	removeX.onclick = () => popup.remove()
	header.appendChild(removeX)
	popup.appendChild(header)
	header.onmousemove = function(event) {
		let rect = header.getBoundingClientRect()
		if (event.buttons == 1) {
			popup.style.left = (event.clientX - header.clientWidth / 2) + "px"
			popup.style.top = (event.clientY - header.clientHeight / 2) + "px"
		}
	}
	let content = createElement("div", "acb-popup-content")
	popup.appendChild(content)
	content.appendChild(createElement("label", "acb-popup-label", "the page you want to report"))
	let input = createElement("input", "acb-popup-url-input")
	content.appendChild(input)
	input.value = window.location.href
	let button = createElement("button", "acb-popup-button", "REPORT ERROR")
	content.appendChild(button)
	content.appendChild(createElement("div", "acb-info-box", "🛈 This will send a report to the developer anonymously. The developer will check the page and will fix it if possible."))
	document.body.appendChild(popup)
	button.onclick = async function() {
		let url = input.value
		button.textContent = "Reporting..."
		try {
			await reportURL(url)
		} catch {}
		popup.remove()
		startLucyAnimation()
	}
}

async function startLucyAnimation() {
	if (ANIMATION_ACTIVE || !options.lucyAnimation) return
	ANIMATION_ACTIVE = true
	addStyle(`
		@keyframes lucy-animation-acb {
			0% {
				top: -100px;
				transform: rotate(0deg);
			}
			50% {
				top: 100px;
			}
			100% {
				top: -100px;
				transform: rotate(-360deg);
			}
		}

		.lucy-acb {
			z-index: 2147483647;
			position: fixed;
			top: -100px;
			right: 10px;
			width: 100px;
			height: 100px;
			animation: lucy-animation-acb 0.8s normal forwards ease-in-out;
		}

		.lucy-acb-img {
			transform: scaleX(-1);
			image-rendering: pixelated;
			width: 100px;
			height: 100px;
		}
	`)
	let lucy = document.createElement("div")
	lucy.classList.add("lucy-acb")
	let lucyImg = document.createElement("img")
	lucyImg.src = `https://www.noel-friedrich.de/anticookiebox/lucy-imgs/${options.lucy}`
	lucyImg.classList.add("lucy-acb-img")
	lucy.appendChild(lucyImg)
	document.body.appendChild(lucy)
	setTimeout(() => {
		document.body.removeChild(lucy)
		ANIMATION_ACTIVE = false
	}, 1200)
}

async function removeCookieBoxes() {
	// get all relevant elements (based on hierarchy + tag)
	let relevantElements = getRelevantElements()

	// loop through all elements and delete those that are cookie boxes
	relevantElements.forEach(element => {
		let score = scoreElement(element)
		if (score >= options.threashold) {
			cookieLog(`Removing (${score}P)`, element)
			startLucyAnimation()
			element.remove()
			cookiesRemoved += 1
		}
	})
}

async function run() {
	// delete cookie boxes
	removeCookieBoxes(options)

	// remove scroll lock if specified
	if (options.scrollLock)
		removeScrollLock()
	
	// send amount of cookie boxes removed to background script
	if (cookiesRemoved > 0) {
		chrome.runtime.sendMessage({
			type: "cookie-notification", cookiesRemoved: cookiesRemoved
		})
	}

	// add amount of cookie boxes removed to sync storage
	saveCookiesRemoved(window.location.href, cookiesRemoved)
}

async function initOptions() {
	return new Promise(async (resolve, reject) => {
		let syncStorage = await getSyncStorage()
		let solutions = await getSolutions()

		// set keywords according to users settings
		switch (syncStorage.acb_mode) {
			case "normal":
				options.keyWords = standardOptions.keywords.standard
				break
			case "aggressive":
				options.keyWords = standardOptions.keywords.aggressive
				break
			case "peaceful":
				options.keyWords = standardOptions.keywords.peaceful
				break
		}

		// set scrolllock
		options.scrollLock = syncStorage.acb_scrolllock

		// set correct lucy for animation
		if (syncStorage.acb_lucy < 0 || syncStorage.acb_lucy > LUCY_IMAGES.length - 1) {
			options.lucy = LUCY_IMAGES[getRandomInt(0, LUCY_IMAGES.length - 1)]
		} else {
			options.lucy = LUCY_IMAGES[syncStorage.acb_lucy]
		}

		// set lucy animation toggle
		options.lucyAnimation = syncStorage.acb_lucyanimation

		// extra check for custom keywords
		if (syncStorage.acb_keywords.length > 0)
			options.keyWords = syncStorage.acb_keywords
			
		// scan text for keywords
		options.scanText = syncStorage.acb_scan_text

		cookieLog(`mode=${syncStorage.acb_mode} scrolllock=${syncStorage.acb_scrolllock} scanText=${options.scanText} lucyAnimation=${syncStorage.acb_lucyanimation}`)

		// check if this website is in exceptions list
		let url = window.location.href
		let domain = (new URL(url))
		for (let i = 0; i < syncStorage.acb_exceptions.length; i++) {
			if (domain.hostname.endsWith(syncStorage.acb_exceptions[i])) {
				reject("site is in exceptions list")
				return
			}
		}

		// check if this website is in solutions list
		for (let customSolution of solutions) {
			if (domain.hostname.endsWith(customSolution.url)) {
				if (customSolution.do_nothing) {
					cookieLog(`site is customly excepted to do nothing`)
					reject("site is custom rejected")
					return
				} else {
					options.keyWords = customSolution.keywords.split(",").map(e => e.trim())
					cookieLog(`custom keywords from custom solutions: ${customSolution.keywords}`)
				}
				break
			}
		}

		// else finish initiation of Settings
		resolve()
	})
}

async function main() {
	// clear current saved amount of cookies removed
	chrome.runtime.sendMessage({
		type: "cookie-notification",
		cookiesRemoved: ""
	})

	// try initiating options
	try {
		await initOptions()
	} catch { // will reject if site is in exceptions list
		chrome.runtime.sendMessage({type: "acb-exception"})
		cookieLog("Encountered Permanent Exception [EXITING]")
		return
	}

	let localStorage = await getLocalStorage()

	// additional check for local exception
	if (
		localStorage.exception == window.location.href
	) {
		cookieLog("Encountered Temporary Exception [EXITING]")
		return
	}

	// run script once immediately
	run()

	// run the script in specified intervals
	for (let i = 0; i < options.timeIntervals.length; i++) {
		setTimeout(run, options.timeIntervals[i])
	}

	// after all intervals have cleared, log that the script has finished
	setTimeout(function() {
		cookieLog(`Removed ${cookiesRemoved} Cookie related Element/s`)
	}, Math.max(...options.timeIntervals))
}

// add runtime listener for reporting
chrome.runtime.onMessage.addListener(request => {
	if (request.type == "report") {
		createReportPopup()
	}
})

// begin execution by calling async main method
main()

// for certain sites, there are manual options to override the keywords
// the library of keywords is updated once a day
