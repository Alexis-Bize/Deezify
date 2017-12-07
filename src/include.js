/*
 * Deezify - 1.0.1
 * @author: Alexis (@_SuckMyLuck) Bize <alexis.bize@gmail.com>
 * @about: Match and download any track from your favorite streaming music service, without limit or ads
 */

 	'use strict';

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
 		'spotify': 'open.spotify.com',
 		'xboxmusic': 'music.xbox.com',
 		'beatsmusic': 'listen.beatsmusic.com'
 	};

	var hostPlayer = null,
		hostInjectionPlayerContainer = null,
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
 		deezifyTextContainer = null,
 		deezifyIconContainer = null;

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

	var deezify = {

		setLocales: function(host)
		{
			hostLocales.downloadMp3		= chrome.i18n.getMessage(host + 'DownloadMessage');
			hostLocales.undefinedMp3	= chrome.i18n.getMessage(host + 'DownloadError');
			hostLocales.matchingMp3		= chrome.i18n.getMessage(host + 'DownloadMatching');
			hostLocales.captchaError	= chrome.i18n.getMessage(host + 'CaptchaError');
		},

		initDownload: function(e)
		{
			if (!downloadEnabled)
				return false;

			downloadEnabled = false;
			var downloadRef = e.srcElement.dataset.deezifyRef;
			if (typeof downloadRef === 'undefined')
				var downloadRef = e.srcElement.parentElement.dataset.deezifyRef;
		
			deezifyTextContainer.innerText = hostLocales.matchingMp3;

			if (downloadRef === 'player')
			{
				if (currentHost === hostsList.deezer)
				{
					hostSongData.title_container = document.getElementById('player_track_title');
					hostSongData.performer_container = document.getElementById('player_track_artist_container');
					hostSongData.title = hostSongData.title_container.innerText;
					hostSongData.performer = hostSongData.performer_container.innerText;
					hostSongData.track_version = deezify.getDzrTrackVersion();
				}

				else if (currentHost === hostsList.xboxmusic)
				{
					hostSongData.title_container = hostPlayer.getElementsByClassName('primaryMetadata')[1];
					hostSongData.performer_container = hostPlayer.getElementsByClassName('secondaryMetadata')[1];
					hostSongData.title = hostSongData.title_container.innerText.trim();
					hostSongData.performer = hostSongData.performer_container.getElementsByTagName('a')[0].innerText.trim();
				}

				else if (currentHost === hostsList.spotify)
				{
					hostSongData.title_container = hostPlayer.getElementsByTagName('h3')[0];
					hostSongData.performer_container = hostPlayer.getElementsByTagName('h4')[0];
					hostSongData.title = hostSongData.title_container.innerText.trim();
					hostSongData.performer = hostSongData.performer_container.getElementsByTagName('a')[0].innerText.trim();
				}

				return deezify.matchData(hostSongData);
			}
		},

		matchData: function(songData, captchaData)
		{
			captchaData = captchaData || null;
			var apiQueryData = {
				'title': songData.performer + ' - ' + songData.title,
				'auto_complete': 1,
				'access_token': vkParams.app.token,
				'v': vkParams.api.version
			};

			if (songData.track_version)
				apiQueryData.title = apiQueryData.title + ' ' + songData.track_version;

			if (captchaData !== null)
			{
				apiQueryData.captcha_sid = captchaData.sid;
				apiQueryData.captcha_key = captchaData.key;
			}

			var trackTitlePatch = {
				' (Album Version Explicit)': '',
				' (Explicit Version)': '',
				' (Skit Explicit)': '',
				' (Album Version Edited)': '',
				' (Motion Picture Soundtrack)': '',
				' (From The Nissan Qashqai Movie)': ''
			};

			for (var patch in trackTitlePatch)
				apiQueryData.title = apiQueryData.title.replace(patch, trackTitlePatch[patch]);

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open('GET', vkParams.api.url + '/method/execute.' + vkParams.api.method + deezify.encodeQueryData(apiQueryData), true);
			xmlhttp.send();
			xmlhttp.onreadystatechange = function()
			{
				if (xmlhttp.readyState === 4)
				{
					var apiResponse = JSON.parse(xmlhttp.response);
					if (typeof apiResponse.error === 'undefined' && apiResponse.response.count)
					{
						var url = document.createElement('a');
					 	url.download = apiQueryData.title + ' - Deezify.mp3';
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

					else if (apiResponse.error.error_code === 14)
					{
						return deezify.setCaptcha({
							'songData': songData,
							'captchaData': {
								'sid': apiResponse.error.captcha_sid,
								'img': apiResponse.error.captcha_img
							}
						});
					}

					else return deezify.setApiError(1);
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
						deezify.fade('out', deezifyTextContainer, 100, function()
						{
							deezifyTextContainer.innerText = hostLocales.downloadMp3;
							deezify.fade('in', deezifyTextContainer, 100, function()
							{
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
			xPlayerData.text = 'localStorage.setItem("' + localStorageKey + 'trackVersion", dzPlayer.getCurrentSongInfo().VERSION || "");';
			document.body.appendChild(xPlayerData);
			document.body.removeChild(xPlayerData);
			return localStorage.getItem(localStorageKey + 'trackVersion');;
		},

		fade: function(type, element, speed, callback)
		{
			if (typeof callback !== 'function') callback = null;
			if (typeof speed === 'function') callback = speed;
			else if (typeof speed === 'undefined') speed = 200;
			else speed = parseInt(speed);
			speed = speed / 10;

			if (type === 'in')
			{
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
			}

			else if (type === 'out')
			{
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
			}

		}

	};

	if (currentHost === hostsList.rdio)
	{
		// TODO, maybe
	}

	else if (currentHost === hostsList.deezer)
	{
		deezify.setLocales('deezer');
		var getPlayer = setInterval(function() {
			if (document.getElementById('player_track_title'))
			{
				clearInterval(getPlayer);
				hostPlayer = document.getElementsByClassName('player')[0];

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
		}, 200);
	}

	else if (currentHost === hostsList.spotify)
	{
		deezify.setLocales('spotify');
		var getPlayer = setInterval(function() {
			if (!!~document.body.className.indexOf('started'))
			{
				clearInterval(getPlayer);
				hostPlayer = document.getElementById('app-player').contentDocument.getElementById('player');

				hostInjectionPlayerContainer = document.getElementById('main-nav').getElementsByTagName('ul')[0];
				deezifyPrimaryContainer = document.createElement('li');
				deezifyPrimaryContainer.className = 'deezify-container';
				hostInjectionPlayerContainer.appendChild(deezifyPrimaryContainer);

				deezifyLinkContainer = document.createElement('a');
				deezifyLinkContainer.className = 'deezify-link spoticon-download-32 standard-menu-item';
				deezifyLinkContainer.setAttribute('data-deezify-ref', 'player');
				deezifyPrimaryContainer.appendChild(deezifyLinkContainer);

				deezifyTextContainer = document.createElement('span');
				deezifyTextContainer.className = 'deezify-text nav-text';
				deezifyTextContainer.innerText = hostLocales.downloadMp3;
				deezifyLinkContainer.appendChild(deezifyTextContainer);

				deezify.fade('in', deezifyPrimaryContainer, function() {
					deezifyLinkContainer.onclick = deezify.initDownload;
					deezifyTextContainer.onclick = deezifyLinkContainer.click;
				});
			}
		}, 200);
	}

	else if (currentHost === hostsList.xboxmusic)
	{
		deezify.setLocales('xboxMusic');
		var getPlayer = setInterval(function() {
			if (document.getElementsByClassName('playerNowPlayingMetadata').length)
			{
				clearInterval(getPlayer);
				hostPlayer = document.getElementsByClassName('player')[0];

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
		}, 200);
	}

	else if (currentHost === hostsList.beatsmusic)
	{
		// Meh
	}
