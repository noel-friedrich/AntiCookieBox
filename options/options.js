standard_exceptions = [
	"google.com",
	"live.com",
	"microsoft.com",
	"paypal.com",
	"facebook.com"
]

let keywords = {
	aggressive: [
		"popup",
		"consent_c",
		"cookie",
		"privacy",
		"onetrust",
		"cbox",
		"consent",
		"usercentrics",
		"cmpbox",
		"cc_banner",
		"cc_container",
		"uc-container",
		"dataprotection",
		"overlay",
		"qc-cmp2",
		"dismissible",
		"econda-pp2",
		"gdpr",
		"truste",
		"cklb",
		"chakra-modal__overlay",
		"modal-backdrop",
		"popup"
	],

	standard: [
		"consent_c",
		"cookie",
		"cvcm-consent",
		"cookie-consent",
		"onetrust",
		"truste",
		"usercentrics",
		"cmpbox",
		"cc_banner",
		"cc_container",
		"uc-container",
		"dataprotection",
		"qc-cmp2",
		"alert-dismissible",
		"econda-pp2",
		"gdpr",
		"cklb",
		"sp_message_container", 
		"chakra-modal__overlay",
		"modal-backdrop" //
	],

	peaceful: [
		"onetrust",
		"cbox",
		"usercentrics",
		"cmpbox",
		"cc_banner",
		"cc_container",
		"uc-container",
		"dataprotection"
	]
}

document.getElementById("add_exception_input").addEventListener("keydown", function(event) {
	if (event.keyCode === 13)
		document.getElementById("add_exception").click()
})

function changeMode(evt, direct_evt=false) {
	let new_mode = evt
	if (!direct_evt)
		new_mode = evt.currentTarget.mode

	mode_checks = {
		"aggressive": aggressive_check,
		"normal": normal_check,
		"peaceful": peaceful_check
	}

	if (!mode_checks[new_mode].checked) {
		mode_checks[new_mode].checked = true
	}

	for (let [key, value] of Object.entries(mode_checks)) {
		if (key != new_mode) {
			value.checked = false
			value.removeAttribute("readonly")
		}
	}

	mode_checks[new_mode].setAttribute("readonly", true)

	switch (getCurrentMode()) {
		case "normal":
			addKeywords(keywords.standard)
			break
		case "aggressive":
			addKeywords(keywords.aggressive)
			break
		case "peaceful":
			addKeywords(keywords.peaceful)
			break
	}

	saveSettings()
}

function changeScrollLock(active) {
	document.getElementById("scrolllock-check").checked = active
}

function changeAnimation(active) {
	document.getElementById("animation-check").checked = active
}

function addExceptions(exceptions) {
	let exceptions_tbody = document.getElementById("exceptions_tbody")
	exceptions_tbody.innerHTML = ""
	let no_exceptions_found = false
	if (exceptions.length == 0) {
		exceptions = [
			"No Exceptions Found!",
			"Add Exceptions in the Popup Menu",
			"If you add some, they will appear",
			"in this list here"
		]
		no_exceptions_found = true
	}

	let dark_grey = true

	for (let i = 0; i < exceptions.length; i++) {
		let new_tr = document.createElement("tr")
		let grey = (dark_grey) ? "grey1" : "grey2"
		dark_grey = !dark_grey
		new_tr.setAttribute("class", "exceptions-tr " + grey)
		let td_1 = document.createElement("td")
		td_1.textContent = exceptions[i]
		new_tr.appendChild(td_1)

		if (!no_exceptions_found) {
			let td_2 = document.createElement("td")
			td_2.setAttribute("class", "remove_exception")
			td_2.parent_row = new_tr
			td_2.addEventListener("click", removeException)
			td_2.textContent = "x"
			new_tr.appendChild(td_2)
		}

		exceptions_tbody.appendChild(new_tr)
	}
}

function removeException(evt) {
	let parent_row = evt.currentTarget.parent_row
	parent_row.remove()
	let curr_exceptions = getExceptionsFromHTML()
	addExceptions(curr_exceptions)
	saveSettings()
}

function getExceptionsFromHTML() {
	let exceptions_tbody = document.getElementById("exceptions_tbody")
	let rows = exceptions_tbody.children
	let new_exceptions = []
	for (let i = 0; i < rows.length; i++) {
		let exception = rows[i].children[0].textContent
		if (exception)
			new_exceptions.push(exception)
	}
	console.log(new_exceptions)
	let placeholder_exceptions = [
		"No Exceptions Found!",
		"Add Exceptions in the Popup Menu",
		"If you add some, they will appear",
		"in this list here"
	]

	return (JSON.stringify(placeholder_exceptions) == JSON.stringify(new_exceptions)) ? [] : new_exceptions
}

function getCurrentMode() {
	if (aggressive_check.checked) 	return "aggressive"
	if (normal_check.checked	) 	return "normal"
	if (peaceful_check.checked	) 	return "peaceful"
}

function addException() {
	let input_field = document.getElementById("add_exception_input")
	let new_exception = input_field.value
	let url_regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/gm
	if (!new_exception.match(url_regex)) {
		document.getElementById("add_exception_error").style.display = "block"
		return
	} else {
		document.getElementById("add_exception_error").style.display = "none"
	}
	let curr_exceptions = getExceptionsFromHTML()
	curr_exceptions.push(new_exception)
	addExceptions(curr_exceptions)
	input_field.value = ""
	saveSettings()
}

document.getElementById("add_exception").addEventListener('click', addException)
document.getElementById("scrolllock-check").addEventListener('click', saveSettings)
document.getElementById("animation-check").addEventListener('click', saveSettings)

let aggressive_check = document.getElementById('aggressive-check')
let normal_check = document.getElementById('normal-check')
let peaceful_check = document.getElementById('peaceful-check')

aggressive_check.mode = "aggressive"
normal_check.mode = "normal"
peaceful_check.mode = "peaceful"

aggressive_check.addEventListener('click', changeMode)
normal_check.addEventListener('click', changeMode)
peaceful_check.addEventListener('click', changeMode)

function saveSettings() {
	let curr_mode = getCurrentMode()
	let curr_exceptions = getExceptionsFromHTML()
	chrome.storage.sync.set({
		acb_mode: curr_mode,
		acb_exceptions: curr_exceptions,
		acb_keywords: getKeywords(),
		acb_lucy: lucySkinIndex,
		acb_scrolllock: document.getElementById("scrolllock-check").checked,
		acb_lucyanimation: document.getElementById("animation-check").checked
	}, function() {
		let status = document.getElementById('save_button')
		status.textContent = 'Settings Saved'
		setTimeout(function() {
		  status.textContent = 'Save'
		}, 1500)
	});
}

let save_button = document.getElementById('save_button')
save_button.addEventListener("click", saveSettings)

function addKeywords(keywords) {
	let textarea = document.getElementById("keywords_text")
	textarea.textContent = keywords.join(", ")
}

function getKeywords() {
	let textarea = document.getElementById("keywords_text")
	let output = []
	let split = textarea.value.split(",")
	for (let i = 0; i < split.length; i++) {
		output.push(split[i].trim())
	}
	return output
}

function toggleKeyWords() {
	let div = document.getElementById("keywords_div")
	div.style.display = (div.style.display != "block") ? "block" : "none"
}

document.getElementById("keywords_header").addEventListener('click', toggleKeyWords);

let lucySkinIndex = 0

function drawLucySkins(selectedLucy) {
	for (let i = 0; i < 15; i++) {
		let skin = document.getElementById("skin" + (i + 1))
		if (i != selectedLucy) {
			skin.classList.add("fadeout")
		} else if (skin.classList.contains("fadeout")) {
			skin.classList.remove("fadeout")
		}
		if (i == selectedLucy) {
			lucySkinIndex = i
			let name = `"${skin.parentElement.getAttribute("title")}"`
			document.getElementById("skin-desc").textContent = name
		}
		skin.onclick = () => {
			drawLucySkins(i)
		}
	}
	saveSettings()
}

function restoreSettings() {
	chrome.storage.sync.get({
		acb_mode: 'normal',
		acb_exceptions: standard_exceptions,
		acb_keywords: keywords.standard,
		acb_lucy: 0,
		acb_scrolllock: true,
		acb_lucyanimation: true
    }, function(items) {
		changeAnimation(items.acb_lucyanimation)
		changeScrollLock(items.acb_scrolllock)
		changeMode(items.acb_mode, direct_evt=true)
		addExceptions(items.acb_exceptions)
		addKeywords(items.acb_keywords)
		drawLucySkins(items.acb_lucy)
    });
}

restoreSettings()