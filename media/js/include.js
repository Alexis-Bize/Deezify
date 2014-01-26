/*
 * Deezify - 1.0
 * @author: Alexis (@_SuckMyLuck) Bize <alexis.bize@gmail.com>
 * @about: Match and download any track from your favorite streaming music service, without limit or ads
 */

var vkParams = {
	'app': {
		'token': 'aafe2494f3e87bb95a03c75ccbcb2bebeb6e5178d09dae8b7d4fca92cf3441bcec7d6789fef63b1cdc90d'
	},
	'api': {
		'url': 'https://api.vk.com',
		'method': 'getTrack',
		'version': '5.7'
	}
};

var hostsList = {
	'rdio': 'www.rdio.com',
	'deezer': 'www.deezer.com',
	'spotify': 'play.spotify.com',
	'xboxmusic': 'music.xbox.com',
	'beatsmusic': 'listen.beatsmusic.com'
};

var hostPlayer = null,
	hostPlayerTrackInfoContainer = null,
	hostLocales = {
		'downloadMp3': null,
		'undefinedMp3': null,
		'matchingMp3': null,
		'captchaTitle': chrome.i18n.getMessage('globalCaptchaTitle'),
		'captchaSubmit': chrome.i18n.getMessage('globalCaptchaSubmit'),
		'captchaError': null
	},
	hostSongData = {
		'title': null,
		'title_container': null,
		'performer': null,
		'performer_container': null,
		'track_version': null
	};

var currentHost = window.location.host;
var localStorageKey = 'deezify_';
var downloadEnabled = true,
	captchaRequested = false;

var deezifyPrimaryContainer = null,
	deezifyLinkContainer = null,
	deezifyTextContainer = null;

var hostInjectionPlayerContainer = null;

var captchaBackground = document.createElement('div');
	captchaBackground.className = 'deezify-captcha-background';
	document.body.appendChild(captchaBackground);

var captchaContainer = document.createElement('div');
	captchaContainer.className = 'deezify-captcha-container';
	captchaBackground.appendChild(captchaContainer);

var captchaTitle = document.createElement('div');
	captchaTitle.className = 'deezify-captcha-title';
	captchaTitle.innerHTML = '<span>' + hostLocales.captchaTitle + '</span>';
	captchaContainer.appendChild(captchaTitle);

var captchaAction = document.createElement('div');
	captchaAction.className = 'deezify-captcha-action';
	captchaContainer.appendChild(captchaAction);

switch (currentHost)
{
	case hostsList.rdio:
		break;

	case hostsList.deezer:

		hostLocales.downloadMp3 = chrome.i18n.getMessage('deezerDownloadMessage');
		hostLocales.undefinedMp3 = chrome.i18n.getMessage('deezerDownloadError');
		hostLocales.matchingMp3 = chrome.i18n.getMessage('deezerDownloadMatching');
		hostLocales.captchaError = chrome.i18n.getMessage('deezerCaptchaError');

		hostPlayer = document.getElementsByClassName('player')[0];
		if (typeof hostPlayer === 'undefined')
			break;

		var hostPlayerTrackInfoContainer = hostPlayer.getElementsByClassName('track-info')[0];
			hostPlayerTrackInfoContainer.addEventListener('DOMSubtreeModified', playerReady);
	
		function playerReady(e)
		{
			if (e.srcElement.id === 'player_track_title')
			{
				hostPlayerTrackInfoContainer.removeEventListener('DOMSubtreeModified', playerReady);
				hostSongData.title_container = document.getElementById('player_track_title');
				hostSongData.performer_container = document.getElementById('player_track_artist');

				hostInjectionPlayerContainer = document.getElementsByClassName('topbar')[0].getElementsByClassName('nav')[0];
				deezifyPrimaryContainer = document.createElement('li');
				deezifyPrimaryContainer.className = 'deezify-container';
				hostInjectionPlayerContainer.appendChild(deezifyPrimaryContainer);

				deezifyLinkContainer = document.createElement('a');
				deezifyLinkContainer.className = 'deezify-link';
				deezifyLinkContainer.setAttribute('data-deezify-ref', 'player');
				deezifyPrimaryContainer.appendChild(deezifyLinkContainer);

				deezifyTextContainer = document.createElement('span');
				deezifyTextContainer.className = 'deezify-text';
				deezifyTextContainer.innerText = hostLocales.downloadMp3;
				deezifyLinkContainer.appendChild(deezifyTextContainer);

				deezify.fade('in', deezifyPrimaryContainer, function() {
					deezifyLinkContainer.onclick = deezify.initDownload;
					deezifyTextContainer.onclick = deezifyLinkContainer.click;
				});
			}
		}
		break;

	case hostsList.spotify:
		break;

	case hostsList.xboxmusic:

		hostLocales.downloadMp3 = chrome.i18n.getMessage('xboxMusicDownloadMessage');
		hostLocales.undefinedMp3 = chrome.i18n.getMessage('xboxMusicDownloadError');
		hostLocales.matchingMp3 = chrome.i18n.getMessage('xboxMusicDownloadMatching');
		hostLocales.captchaError = chrome.i18n.getMessage('xboxMusicCaptchaError');

		hostPlayer = document.getElementById('player');
		if (typeof hostPlayer === 'undefined')
			break;

		hostPlayer.addEventListener('DOMSubtreeModified', playerReady);

		function playerReady(e)
		{
			if (e.srcElement.className === 'playerNowPlaying'
			&& typeof hostPlayer.getElementsByClassName('primaryMetadata')[1] !== 'undefined')
			{
				hostPlayer.removeEventListener('DOMSubtreeModified', playerReady);

				hostInjectionPlayerContainer = document.getElementById('navigation').getElementsByTagName('ul')[0];
				deezifyPrimaryContainer = document.createElement('li');
				deezifyPrimaryContainer.className = 'deezify-container';
				hostInjectionPlayerContainer.appendChild(deezifyPrimaryContainer);

				deezifyLinkContainer = document.createElement('a');
				deezifyLinkContainer.className = 'deezify-link';
				deezifyLinkContainer.setAttribute('data-deezify-ref', 'player');
				deezifyPrimaryContainer.appendChild(deezifyLinkContainer);

				deezifyIconContainer = document.createElement('span');
				deezifyIconContainer.className = 'iconRowSecondaryAdd';
				deezifyLinkContainer.appendChild(deezifyIconContainer);

				deezifyTextContainer = document.createElement('span');
				deezifyTextContainer.className = 'deezify-text';
				deezifyTextContainer.innerText = hostLocales.downloadMp3;
				deezifyLinkContainer.appendChild(deezifyTextContainer);

				deezify.fade('in', deezifyPrimaryContainer, function() {
					deezifyLinkContainer.onclick = deezify.initDownload;
					deezifyTextContainer.onclick = deezifyLinkContainer.click;
				});
			}
		}
		break;

	case hostsList.beatsmusic:
		break;
}

var deezify = {

	initDownload: function(e)
	{
		if (!downloadEnabled)
			return false;

		downloadEnabled = false;
		var downloadRef = e.srcElement.dataset.deezifyRef;
		if (typeof downloadRef === 'undefined')
			var downloadRef = e.srcElement.parentElement.dataset.deezifyRef;

		deezifyTextContainer.innerText = hostLocales.matchingMp3;

		switch(currentHost)
		{
			case hostsList.deezer:
				if (downloadRef === 'player')
				{
					hostSongData.title = hostSongData.title_container.innerText.trim();
					hostSongData.performer = hostSongData.performer_container.innerText.trim();
					hostSongData.track_version = deezify.getDzrTrackVersion();
					return deezify.matchData(hostSongData);
				}
				break;
			case hostsList.xboxmusic:
				if (downloadRef === 'player')
				{
					hostSongData.title_container = hostPlayer.getElementsByClassName('primaryMetadata')[1];
					hostSongData.performer_container = hostPlayer.getElementsByClassName('secondaryMetadata')[1];

					hostSongData.title = hostSongData.title_container.innerText.trim();
					hostSongData.performer = hostSongData.performer_container.getElementsByTagName('a')[0].innerText.trim();
					return deezify.matchData(hostSongData);
				}
				break;
			default:
				downloadEnabled = true;
				return false;
		}	
	},

	matchData: function(songData, captchaData)
	{
		captchaData = captchaData || null;
		var vkQueryData = {
			'title': songData.performer + ' - ' + songData.title,
			'auto_complete': 1,
			'access_token': vkParams.app.token,
			'v': vkParams.api.version
		};

		if (songData.track_version)
			vkQueryData.track = vkQueryData.track + ' ' + songData.track_version;

		if (captchaData !== null)
		{
			vkQueryData.captcha_sid = captchaData.sid;
			vkQueryData.captcha_key = captchaData.key;
		}

		xmlhttp = new XMLHttpRequest();
		xmlhttp.open('GET', vkParams.api.url + '/method/execute.' + vkParams.api.method + deezify.encodeQueryData(vkQueryData), true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function()
		{
			if (xmlhttp.readyState === 4)
			{
				var apiResponse = JSON.parse(xmlhttp.response);
				if (typeof apiResponse.error === 'undefined' && apiResponse.response.count)
				{
					var url = document.createElement('a');
				 		url.download = vkQueryData.title + ' - Deezify.mp3';
						url.href = apiResponse.response.items[0].url;
						url.dataset.downloadurl = ['audio/mpeg', url.download, url.href].join(':');
						url.click();

					deezifyTextContainer.innerText = hostLocales.downloadMp3;
					downloadEnabled = true;
				}
				else if (typeof apiResponse.error === 'undefined' && !apiResponse.response.count)
					return deezify.setApiError(1);
				else if (typeof apiResponse.error !== 'undefined' && captchaRequested)
					return deezify.setApiError(2);
				else
				{
					var apiError = apiResponse.error.error_code;
					switch (apiError)
					{
						case 14:
							return deezify.setCaptcha({
								'songData': songData,
								'captchaData': {
									'sid': apiResponse.error.captcha_sid,
									'img': apiResponse.error.captcha_img
								}
							});
							break;
						default:
							return deezify.setApiError(1);
					}
				}
			}
		};
		return false;
	},

	setCaptcha: function(data)
	{
	 	var captchaImg = document.createElement('img');
	 		captchaImg.className = 'deezify-captcha-image';
	 		captchaImg.src = data.captchaData.img;
	 		captchaAction.appendChild(captchaImg);

	 	var captchaForm = document.createElement('form');
	 		captchaForm.className = 'deezify-captcha-form';
	 		captchaForm.innerHTML = '<input type="text" class="deezify-captcha-input" />';
	 		captchaAction.appendChild(captchaForm);

	 	var captchaSubmit = document.createElement('input');
	 		captchaSubmit.className = 'deezify-captcha-submit';
	 		captchaSubmit.type = 'submit';
	 		captchaSubmit.value = hostLocales.captchaSubmit;
	 		captchaForm.appendChild(captchaSubmit);
	 	
	 	deezify.fade('in', captchaBackground, 100);
	 	captchaRequested = true;

	 	captchaForm.onsubmit = function(e)
	 	{
	 		e.preventDefault();
	 		deezify.fade('out', captchaBackground, 100, function()
			{
	 			data.captchaData.key = captchaForm.getElementsByClassName('deezify-captcha-input')[0].value;
				captchaAction.innerHTML = '';
				return deezify.matchData(data.songData, data.captchaData);
	 		});
	 	};
	},

	setApiError: function(errorType)
	{
		errorType = parseInt(errorType) || 1;
		deezify.fade('out', deezifyTextContainer, 100, function()
		{
			deezifyTextContainer.innerText = errorType === 2 ? hostLocales.captchaError : hostLocales.undefinedMp3;
			deezify.fade('in', deezifyTextContainer, 100, function()
			{
				setTimeout(function()
				{
					deezify.fade('out', deezifyTextContainer, 100, function() {
						deezifyTextContainer.innerText = hostLocales.downloadMp3;
						deezify.fade('in', deezifyTextContainer, 100, function() {
							downloadEnabled = true;
							captchaRequested = false;
						});
					});
				}, 2000);
			});
		});
	},

	encodeQueryData: function(data)
	{
		var query = [];
		for (var key in data)
			query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
		return '?' + query.join('&');
	},

	getDzrTrackVersion: function()
	{
		var xPlayerData = document.createElement('script');
		xPlayerData.type = 'text/javascript';
		xPlayerData.text = 'localStorage.setItem("' + localStorageKey + 'trackVersion", (dzPlayer.getCurrentSongInfo().VERSION || ""));';
		document.body.appendChild(xPlayerData);
		var trackVersion = localStorage.getItem(localStorageKey + 'trackVersion');
		document.body.removeChild(xPlayerData);
		return trackVersion;
	},

	fade: function(type, element, speed, callback)
	{
		if (typeof callback !== 'function') callback = null;
		if (typeof speed === 'function') callback = speed;
		else if (typeof speed === 'undefined') speed = 200;
		else speed = parseInt(speed);
		speed = speed / 10;

		switch (type)
		{
			case 'in':
				element.style.display = 'block';
				element.style.opacity = 0;
				var interval = setInterval(function()
				{
					var elementOpacity = element.style.opacity;
					if (elementOpacity >= 1)
					{
						clearInterval(interval);
						element.style.opacity = 1;
						if (callback !== null)
							return callback();
					}
					element.style.opacity = parseFloat(elementOpacity) + 0.05;
				}, speed);
				break;
			case 'out':
				element.style.opacity = 1;
				var interval = setInterval(function()
				{
					var elementOpacity = element.style.opacity;
					if (elementOpacity <= 0.1)
					{
						element.style.display = 'none';
						clearInterval(interval);
						element.style.opacity = 0;
						if (callback !== null)
							return callback();
					}
					element.style.opacity = parseFloat(elementOpacity) - 0.05;
				}, speed);
				break;
		}
	}

};
