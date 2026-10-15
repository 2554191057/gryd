"use strict";
window.addEventListener('DOMContentLoaded', function () {
    var playerEle = document.querySelectorAll('#xf-MusicPlayer')
    if (playerEle.length === 0) {
        return
    }

    if (
        typeof Symbol !== 'function' ||
        typeof Promise !== 'function' ||
        typeof Object.assign !== 'function' ||
        typeof Array.from !== 'function' ||
        typeof Array.prototype.includes !== 'function' ||
        typeof (() => { }) !== 'function' ||
        typeof `template ${'string'}` !== 'string' ||
        ({}).toString.call({ ...{} }) !== '[object Object]' ||
        Array.isArray([]) !== true
    ) {
        this.alert('当前浏览器不支持解析 ES6 语法，无法使用“xf-MusicPlayer”插件，请升级您的浏览器！')
        window.location.href = 'http://support.dmeng.net/upgrade-your-browser.html?referrer=' + encodeURIComponent(window.location.href)
        return
    }

    const xfHead = document.head
    const playerBody = document.body

    const metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
        let newMeta = document.createElement('meta')
        newMeta.setAttribute('name', 'viewport')
        newMeta.setAttribute('content', 'width=device-width, initial-scale=1.0')
        xfHead.appendChild(newMeta)
    }

    let MusicPlayer = [...playerEle]
    if (MusicPlayer.length > 1) {
        MusicPlayer.splice(1)
    }
    MusicPlayer = MusicPlayer[0]

    let interfaceAndLocal = MusicPlayer.getAttribute('data-localMusic')

    const xfSongList = MusicPlayer.getAttribute('data-songList')

    let musicApi = `${location.protocol}//${MusicPlayer.getAttribute('data-musicApi')}`.trim()

    if (musicApi.slice(-4) === 'null') {
        musicApi = `${location.protocol}//api.xfyun.club`
    }

    if (musicApi.slice(-4) === 'null' && interfaceAndLocal === null && xfSongList === null) {
        this.alert('请输入音乐API域名')
        return
    }

    customFile()

    function customFile() {
        const cdnName = MusicPlayer.getAttribute('data-cdnName')
        const wl = window.location
        let xfDomainName = cdnName === null ? `${wl.protocol}//${wl.hostname}${wl.port ? ':' + wl.port : ''}` : cdnName.trim()

        if (wl.protocol === 'https:') {
            const metaTag = document.createElement('meta')
            metaTag.setAttribute('http-equiv', 'Content-Security-Policy')
            metaTag.setAttribute('content', 'upgrade-insecure-requests')
            xfHead.appendChild(metaTag)
        }

        const removeDotAndSlash = str => str.replace(/(^[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+$)/g, '')
        const filePath = MusicPlayer.getAttribute('data-filePath')

        if (filePath !== null) {
            xfDomainName += `/${removeDotAndSlash(filePath)}`
        }

        const appendStylesheet = href => {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = href
            
            if (cdnName !== null && cdnName !== '') {
                return xfHead.appendChild(link)
            } else {
                return new Promise((resolve, reject) => {
                    fetch(href)
                        .then(response => {
                            if (response.ok) {
                                xfHead.appendChild(link)
                                resolve()
                            } else {
                                reject(`链接不可用: ${href}`)
                            }
                        })
                        .catch(error => {
                            reject(`发生错误：${error}`)
                        })
                })
            }
        }

        const xfCssOne = 'xfplayIcon.min.css' || 'xfplayIcon.css'
        const xfCssTow = 'xf-MusicPlayer.min.css' || 'xf-MusicPlayer.css'
        let xfplayIconCSS = `${xfDomainName}/xf-MusicPlayer/icon/${xfCssOne}?v=20261015j`
        let MusicPlayerCSS = `${xfDomainName}/xf-MusicPlayer/css/${xfCssTow}?v=20261015j`

        if (location.protocol === 'file:') {
            xfplayIconCSS = 'https://player.xfyun.club/js/xf-MusicPlayer/icon/xfplayIcon.min.css'
            MusicPlayerCSS = 'https://player.xfyun.club/js/xf-MusicPlayer/css/xf-MusicPlayer.min.css'
            musicApi = 'https://api.xfyun.club'
        }

        Promise.all([
            appendStylesheet(xfplayIconCSS),
            appendStylesheet(MusicPlayerCSS),
        ])
            .catch(error => {
                MusicPlayer.remove()
                console.error(error)
                alert('请把插件放在网页根目录，否则无法运行【xf-MusicPlayer.js】插件！')
                return
            })
    }

    startExecutionPlayer()

    function startExecutionPlayer() {
        const characterToElement = (str, mainBox) => {
            const parser = new DOMParser()
            let ele = parser.parseFromString(str, 'text/html')
            ele = ele.body.firstChild
            mainBox.appendChild(ele)
        }

        let musicStr = `<div class="xf-MusicPlayer-Main"><div class="xf-switchPlayer"><i class="iconfont icon-jiantou2"></i></div><div class="xf-insideSong"><div class="xf-songPicture"><img src="xf-MusicPlayer/images/playerLoad.gif"alt="加载中..."class="xf-musicPicture"><i class="xf-musicalNote iconfont icon-yinle"></i><i class="xf-musicalNote iconfont icon-yinle"></i><i class="xf-musicalNote iconfont icon-yinle"></i></div><div class="xf-musicControl"><div class="xf-topControl"><div class="xf-introduce"><h3 class="xf-songName"></h3><p class="xf-singer"></p></div><ul class="xf-playerControl"><li class="xf-previousSong"><i class="iconfont icon-shangyishou"></i></li><li class="xf-playbackControl"><i class="xf-pause iconfont icon-zantingtingzhi"style="display: none;"></i><i class="xf-playBack iconfont icon-bofang"style="display: block;"></i></li><li class="xf-nextSong"><i class="iconfont icon-xiayishou"></i></li></ul></div><ul class="xf-bottomControl"><li class="xf-audioFrequency"><i class="iconfont icon-shengyin-kai"></i></li><li class="xf-progressBar"><h5 class="xf-totalAudioProgress"><p class="xf-audioProgress"style="width: 0;"></p></h5></li><li class="xf-lyricBtn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z"></path></svg></li><li class="xf-repeatBtn"><span class="xf-repeatIcon">&#8635;</span></li><li class="xf-playlistBtn"><i class="iconfont icon-gedan"></i></li></ul></div></div><div class="xf-outsideSongList"><ul class="xf-listOfSongs"></ul></div></div>`

        let lyricStr = `<div id="xf-lyric"><ul class="xf-AllLyric-box"></ul></div>`
        characterToElement(musicStr, MusicPlayer)

        allPlayerFeatures()

        function allPlayerFeatures() {
            const xfAudio = document.createElement('audio')
            xfAudio.id = 'xf-musicAudio'
            playerBody.appendChild(xfAudio)

            const xfMusicAudio = document.getElementById('xf-musicAudio')
            xfMusicAudio.controls = 0

            characterToElement(lyricStr, MusicPlayer.querySelector('.xf-musicControl'))

            const setTimeoutPromise = delay => new Promise(resolve => setTimeout(resolve, delay))

            const playMusic = () => xfMusicAudio.play().catch(error => console.warn(`浏览器默认限制了自动播放：${error}`))

            const pauseMusic = () => xfMusicAudio.pause()

            const MusicPlayerMain = MusicPlayer.querySelector('.xf-MusicPlayer-Main')
            ,switchPlayer = MusicPlayer.querySelector('.xf-switchPlayer')
            ,switchArrow = switchPlayer.querySelector('.icon-jiantou2')
            ,musicPicture = MusicPlayer.querySelector('.xf-musicPicture')
            ,songName = MusicPlayer.querySelector('.xf-songName')
            ,singer = MusicPlayer.querySelector('.xf-singer')
            ,previousSong = MusicPlayer.querySelector('.xf-previousSong')
            ,playbackControl = MusicPlayer.querySelector('.xf-playbackControl')
            ,pause = playbackControl.querySelector('.xf-pause')
            ,playBack = playbackControl.querySelector('.xf-playBack')
            ,nextSong = MusicPlayer.querySelector('.xf-nextSong')
            ,audioFrequency = MusicPlayer.querySelector('.xf-audioFrequency')
            ,totalAudioProgress = MusicPlayer.querySelector('.xf-totalAudioProgress')
            ,audioProgress = MusicPlayer.querySelector('.xf-audioProgress')
            ,playlistBtn = MusicPlayer.querySelector('.xf-playlistBtn')
            ,outsideSongList = MusicPlayer.querySelector('.xf-outsideSongList')
            ,listOfSongs = MusicPlayer.querySelector('.xf-listOfSongs')
            ,musicalNote = MusicPlayer.querySelectorAll('.xf-musicalNote')
            ,xfLyric = playerBody.querySelector('#xf-lyric')

            const themeStyle = MusicPlayer.getAttribute('data-themeColor')
            themeStyle === null ? MusicPlayerMain.classList.add('xf-original') : MusicPlayerMain.classList.add(themeStyle)

            const bottomHeight = MusicPlayer.getAttribute('data-bottomHeight')
            if (bottomHeight) {
                MusicPlayerMain.style.bottom = bottomHeight
            }
            
            const lazyLoadImages = () => {
                const images = playerBody.querySelectorAll('img[data-musicLjz-src]')

                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target
                            const src = img.getAttribute('data-musicLjz-src')

                            img.setAttribute('src', src)

                            img.onload = () => {
                                observer.unobserve(img)
                                img.removeAttribute('data-musicLjz-src')
                            }
                        }
                    })
                })

                images.forEach(image => observer.observe(image))
            }

            const removebePlaying = () => {
                pause.style.display = 'none'
                playBack.style.display = 'block'
                playbackControl.classList.remove('xf-bePlaying')
                musicPicture.classList.add('xf-pauseRotation')
                musicalNote.forEach(ele => ele.classList.add('xf-pausePdyMove'))
                xfLyric.classList.add('xf-lyricHidden')
                xfLyric.classList.remove('xf-lyricShow')
            }

            const addPlaying = () => {
                pause.style.display = 'block'
                playBack.style.display = 'none'
                playbackControl.classList.add('xf-bePlaying')
                musicPicture.classList.remove('xf-pauseRotation')
                musicalNote.forEach(ele => ele.classList.remove('xf-pausePdyMove'))
                xfLyric.classList.remove('xf-lyricHidden')
                xfLyric.classList.add('xf-lyricShow')
            }

            const backgroundColors = ['rgba(85, 0, 255, .35)', 'rgba(0, 225, 255, .35)', 'rgba(255, 165, 0, .35)', 'rgba(0, 100, 0, .35)', 'rgba(80, 0, 0, .35)', 'rgba(255, 192, 203, .35)']
            const themeIndex = { 'xf-original': 0, 'xf-sky': 1, 'xf-orange': 2, 'xf-darkGreen': 3, 'xf-wineRed': 4, 'xf-girlPink': 5 }

            const bgIndex = themeIndex[themeStyle] ?? 0

            let localSongsData = []

            let xfMusicPop
            let isAnimationInProgress = 0
            const displayPopup = async musicName => {
                if (isAnimationInProgress) {
                    return
                }

                if (!xfMusicPop) {
                    xfMusicPop = document.createElement('div')
                    xfMusicPop.classList.add('xf-music-pop')
                    playerBody.appendChild(xfMusicPop)
                }

                xfMusicPop.textContent = musicName

                const musicPopStyle = xfMusicPop.style

                const randomColor = backgroundColors[bgIndex]

                Object.assign(musicPopStyle, {
                    backgroundColor: randomColor
                })

                isAnimationInProgress = 1

                musicPopStyle.left = '-100%'
                await setTimeoutPromise(500)
                musicPopStyle.left = 0
                await setTimeoutPromise(2500)
                musicPopStyle.left = '-100%'

                isAnimationInProgress = 0
            }

            const detectionPlay = async () => {
                await setTimeoutPromise(2000)
                if (xfMusicAudio.paused) {
                    console.warn('您的浏览器限制了有声自动播放，尝试静音自动播放...')
                    xfMusicAudio.muted = true
                    try {
                        await xfMusicAudio.play()
                        audioFrequency.children[0].classList.add('icon-shengyin-guan')
                        audioFrequency.children[0].classList.remove('icon-shengyin-kai')
                        xfMusicAudio.volume = curVolume
                        addPlaying()
                        displayPopup('已自动播放（静音），点击喇叭开启声音')
                    } catch (error) {
                        console.warn('静音自动播放也被拦截，请手动点击播放器继续欣赏歌曲吧~')
                        removebePlaying()
                        displayPopup('点击播放音乐')
                    }
                } else {
                    displayPopup(`正在播放：${songName.textContent}`)
                    addPlaying()
                }
            }

            const fadeOutPlayer = async () => {
                if (MusicPlayer.getAttribute('data-fadeOutAutoplay') !== null) {
                    xfMusicAudio.autoplay = true
                    await setTimeoutPromise(1000)
                    detectionPlay()
                    switchArrow.classList.add('xf-jiantou1')
                    MusicPlayerMain.classList.add('xf-playerShow')
                    playMusic()
                } else {
                    removebePlaying()
                }
            }
            fadeOutPlayer()

            const clearTheDefaultPlayerProperties = () => {
                xfMusicAudio.src = ''
                musicPicture.src = ''
                songName.textContent = ''
                singer.textContent = ''
                musicPicture.alt = ''

                listOfSongs.innerHTML = ''
            }

            const playerMusicItem = (index, music, picture, Title, Author, loadingTime) => {
                let lis = `<li class="xf-songsItem"data-index="${index}"data-mp3url="${music}"><div class="xf-songListSongPictures"><i class="xf-songIcon iconfont icon-bofang"></i><img data-musicLjz-src="${picture}"src="${picture}"alt="songPicture"class="xf-playlistImg"></div><div class="xf-playlistSongInformation"><div class="xf-songTitle"><h5 class="xf-songName">${Title}</h5><p class="xf-authorAndDuration"><sapn class="xf-songAuthor">${Author}</sapn><span class="xf-songLength iconfont icon-shijian">\t${loadingTime}</span></p></div></div></li>`
                characterToElement(lis, listOfSongs)
            }

            async function fetchData(url, method = 'GET', headers = {}, body = null) {
                try {
                    const res = await fetch(url, {
                        method: method,
                        headers: headers,
                        body: body
                    })
                    
                    const data = await res.json()

                    return data
                } catch (error) {
                    throw error
                }
            }

            let songChart = MusicPlayer.getAttribute('data-songChart') || '热歌榜'

            const randomSongList = MusicPlayer.getAttribute('data-randomSongList')
            if (randomSongList === '' || randomSongList === '1' || randomSongList === 'true') {
                let SongListArr = ['热歌榜', '新歌榜', '原创榜', '飙升榜']
                songChart = SongListArr[Math.floor(Math.random() * SongListArr.length)]
            }

            console.log(`%c 正在播放${songChart}的歌曲~`, 'color: #b3c4ec;')

            const musicUrl = musicLinks()

            function musicLinks() {
                if (interfaceAndLocal === null && xfSongList === null) {
                    return `${musicApi}/musicAll/?sortAll=${songChart.trim()}`
                }
                else if (interfaceAndLocal === null && xfSongList !== null) {
                    return `${musicApi}/musicAll/?playlistId=${xfSongList.trim()}`
                } 
                else {
                    return interfaceAndLocal.trim()
                }
            }

            const addLeadingZero = num => num < 10 ? `0${num}` : num

            function convertTime(duration) {
                const minutes = Math.floor(duration / 60)
                const seconds = Math.floor(duration % 60)

                const minutesDisplay = addLeadingZero(minutes)
                const secondsDisplay = addLeadingZero(seconds)

                return `${minutesDisplay}:${secondsDisplay}`
            }

            function millisecondConversion(milliseconds) {
                const minutes = addLeadingZero(Math.floor(milliseconds / 60000))
                const seconds = addLeadingZero(Math.floor((milliseconds % 60000) / 1000))
                return `${minutes}:${seconds} `
            }

            const clickControl = () => {
                let isFunctionTriggered = false

                const togglePlayback = () => {
                    const domLength = MusicPlayer.getElementsByClassName('xf-bePlaying').length
                    if (domLength > 0) {
                        displayPopup('音乐已暂停')
                        pauseMusic()
                        removebePlaying()
                    } else {
                        displayPopup(`正在播放：${songName.textContent}`)
                        playMusic()
                        addPlaying()
                        isFunctionTriggered = true
                    }
                }

                playbackControl.addEventListener('click', togglePlayback)

                window.addEventListener('keyup', e => {
                    e = event
                    if (e.key === ' ' || e.keyCode === 32) {
                        togglePlayback()
                    }
                })

                // 竖向音量调节条（点击喇叭图标向上弹出）
                const volPop = document.createElement('div')
                volPop.className = 'xf-volumePop'
                volPop.style.display = 'none'
                volPop.innerHTML = '<p class="xf-volumeNum">80%</p><h5 class="xf-volumeTotal"><p class="xf-volumeCur" style="height: 80%;"></p><i class="xf-volumeKnob" style="bottom: 80%;"></i></h5><i class="xf-volumeIcon iconfont icon-shengyin-kai"></i>'
                audioFrequency.appendChild(volPop)

                const volCur = volPop.querySelector('.xf-volumeCur')
                const volNum = volPop.querySelector('.xf-volumeNum')
                const volKnob = volPop.querySelector('.xf-volumeKnob')
                let isVolumeSliding = false
                let curVolume = 0.8
                xfMusicAudio.volume = curVolume

                const setVolume = vol => {
                    curVolume = Math.max(0, Math.min(1, vol))
                    xfMusicAudio.volume = curVolume
                    volCur.style.height = `${curVolume * 100}%`
                    volKnob.style.bottom = `${curVolume * 100}%`
                    volNum.textContent = `${Math.round(curVolume * 100)}%`
                    if (curVolume <= 0) {
                        xfMusicAudio.muted = true
                        audioFrequency.children[0].classList.add('icon-shengyin-guan')
                        audioFrequency.children[0].classList.remove('icon-shengyin-kai')
                    } else {
                        xfMusicAudio.muted = false
                        audioFrequency.children[0].classList.add('icon-shengyin-kai')
                        audioFrequency.children[0].classList.remove('icon-shengyin-guan')
                    }
                }

                const volumeFromEvent = e => {
                    const track = volPop.querySelector('.xf-volumeTotal')
                    const rect = track.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    return 1 - y / rect.height
                }

                audioFrequency.addEventListener('click', function (event) {
                    event.stopPropagation()
                    if (volPop.contains(event.target)) return
                    if (volPop.style.display === 'none') {
                        volPop.style.display = 'flex'
                    } else {
                        volPop.style.display = 'none'
                    }
                })

                volPop.addEventListener('mousedown', function (e) {
                    e.preventDefault()
                    e.stopPropagation()
                    isVolumeSliding = true
                    setVolume(volumeFromEvent(e))
                })
                volPop.addEventListener('click', function (e) {
                    e.stopPropagation()
                })
                document.addEventListener('mousemove', function (e) {
                    if (isVolumeSliding) {
                        setVolume(volumeFromEvent(e))
                    }
                })
                document.addEventListener('mouseup', function () {
                    isVolumeSliding = false
                })
                document.addEventListener('click', function (event) {
                    if (volPop.style.display !== 'none' && !audioFrequency.contains(event.target)) {
                        volPop.style.display = 'none'
                    }
                })

                // 循环模式：默认列表循环，点击切换单曲循环
                let repeatOne = false
                const repeatBtn = MusicPlayer.querySelector('.xf-repeatBtn')
                repeatBtn.addEventListener('click', function (event) {
                    event.stopPropagation()
                    repeatOne = !repeatOne
                    xfMusicAudio.loop = repeatOne
                    repeatBtn.classList.toggle('xf-repeatActive', repeatOne)
                    displayPopup(repeatOne ? '单曲循环' : '列表循环')
                })

                // 歌词按钮：点击打开/关闭全屏歌词面板
                const lyricBtn = MusicPlayer.querySelector('.xf-lyricBtn')
                lyricBtn.addEventListener('click', function (event) {
                    event.stopPropagation()
                    if (window._xfOpenFullscreen) {
                        window._xfOpenFullscreen()
                    }
                })

                // 点击底部歌词字幕：打开全屏歌词
                xfLyric.addEventListener('click', function (event) {
                    event.stopPropagation()
                    if (window._xfOpenFullscreen) {
                        window._xfOpenFullscreen()
                    }
                })

                MusicPlayerMain.style.opacity = 0
                const loadXfPlayer = async (dom, val, key) => {
                    const xfStyle = window.getComputedStyle(dom)
                    await setTimeoutPromise(1000)
                    if (xfStyle.getPropertyValue(val) === key) {
                        displayPopup('播放器加载中...')
                        clearTheDefaultPlayerProperties()
                    }
                }
                loadXfPlayer(MusicPlayerMain, 'opacity', '0')

                let lisNum = 0
                const playBackAndForth = async () => {
                    try {
                        let res = await fetchData(musicUrl)

                        if (interfaceAndLocal === null && xfSongList !== null) {
                            res = res.playlist.tracks
                        }

                        localSongsData = res

                        await Promise.all(
                            res.map(async data => {
                                const musicId = data.id
                                const musicName = data.name
                                const artistsname = data.artistsname || data.al.name
                                const picurl = data.picurl || data.al.picUrl
                                const mp3 = data.url || `${musicApi}/musicAll/?songId=${musicId}&mp3Url=mp3`
                                const duration = interfaceAndLocal === null ? data.duration !== undefined ? convertTime(data.duration) : millisecondConversion(data.dt) : data.musicDuration

                                playerMusicItem(musicId, mp3, picurl, musicName, artistsname, duration)
                            })
                        )

                        const checkSongsItemLength = () => {
                            return new Promise(resolve => {
                                const startTime = Date.now()

                                const intervalId = setInterval(() => {
                                    lisNum = MusicPlayer.querySelectorAll('.xf-songsItem').length
                                    const analyticQuantity = res.length

                                    if (lisNum === analyticQuantity) {
                                        clearInterval(intervalId)
                                        const endTime = Date.now()
                                        const waitTime = endTime - startTime
                                        resolve(waitTime)
                                    }

                                }, 30)
                            })
                        }

                        checkSongsItemLength().then(async waitTime => {

                            await setTimeoutPromise(waitTime)

                            if (waitTime <= 100) {
                                console.log(`%c 播放器接口加载耗时：${waitTime}ms`, 'color: #60a060')
                            } else if (waitTime <= 5000) {
                                console.log(`%c 播放器接口加载耗时：${waitTime}ms`, 'color: #ffb87a')
                            } else {
                                console.error(`%c 播放器接口加载超时！`, 'color: #a51212')
                                MusicPlayer.remove()
                            }

                            let songsItem = MusicPlayer.querySelectorAll('.xf-songsItem')
                            if (songsItem.length === 0) {
                                console.error('歌曲未被添加...')
                                return
                            }

                            let currentSongIndex = 0
                            
                            const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

                            const randomSong = getRandomInt(0, songsItem.length)

                            const songStr = MusicPlayer.getAttribute('data-random')
                            if (songStr !== null && songStr !== 'false') {
                                if (songStr !== '' && !isNaN(Number(songStr))) {
                                    currentSongIndex = Number(songStr) > 0 && songStr <= songsItem.length ? Number(songStr) - 1 : 0
                                } else {
                                    currentSongIndex = randomSong
                                }
                            }

                            const updateSong = index => {

                                MusicPlayerMain.style.opacity = 1

                                let eleInExecution
                                songsItem.forEach((ele, i) => {
                                    ele.classList.toggle('xf-inExecution', i === index)
                                    const filteredinExecution = Array.from(songsItem).filter(ele => ele.classList.contains('xf-inExecution'))
                                    eleInExecution = filteredinExecution
                                    ele.querySelector('.xf-songListSongPictures .xf-songIcon').classList.remove('icon-zantingtingzhi')
                                })

                                const item = songsItem[index]
                                const itemPic = (item.querySelector('.xf-playlistImg')?.getAttribute('data-musicljz-src')) ?? item.querySelector('.xf-playlistImg')?.src
                                const itemUrl = item.dataset.mp3url
                                const itemName = item.querySelector('.xf-songName').textContent
                                const itemAuto = item.querySelector('.xf-songAuthor').textContent

                                xfMusicAudio.src = itemUrl
                                musicPicture.src = itemPic
                                musicPicture.alt = itemName
                                songName.textContent = itemName
                                singer.textContent = itemAuto

                                const xfSongIcon = eleInExecution[0].querySelector('.xf-songListSongPictures .xf-songIcon')
                                xfSongIcon.classList.add('icon-zantingtingzhi')

                                if (isFunctionTriggered || MusicPlayer.getAttribute('data-fadeOutAutoplay') !== null) {
                                    playMusic()
                                    addPlaying()
                                    displayPopup(`正在播放：${itemName}`)
                                }

                                const lyricsShowOrHide = MusicPlayer.getAttribute('data-lyrics')
                                
                                if (lyricsShowOrHide !== '0' && lyricsShowOrHide !== 'false') {
                                    xfLyric.style.backgroundColor = backgroundColors[bgIndex]

                                    let xfAllLyri = xfLyric.querySelector('.xf-AllLyric-box')

                                    const convertTimeToSeconds = time => {
                                        const [minutes, seconds] = time.split(':').map(parseFloat)
                                        return minutes * 60 + seconds
                                    }

                                    const renderLyrics = lyricsData => {
                                        xfAllLyri.innerHTML = ''
                                        document.querySelectorAll('.xf-fullscreenLyric').forEach(el => el.remove())

                                        const lines = lyricsData.split('\n')

                                        const lyricsArray = lines.map(line => {
                                            const timeEndIndex = line.indexOf(']')
                                            if (timeEndIndex !== -1) {
                                                const time = convertTimeToSeconds(line.substring(1, timeEndIndex))
                                                const text = line.substring(timeEndIndex + 1).trim()
                                                return { time, text }
                                            } else {
                                                return null
                                            }
                                        }).filter(lyric => lyric !== null)

                                        if (lyricsArray.length) {
                                            xfLyric.textContent = lyricsArray[0].text
                                        }
                                        window._xfLyricsData = lyricsArray

                                        // 全屏歌词面板：点击底部歌词条打开，点击任意行跳转
                                        let fullscreenLyric = null
                                        window._xfFullscreenLyric = null
                                        const closeFullscreenLyric = () => {
                                            if (fullscreenLyric) {
                                                fullscreenLyric.remove()
                                                fullscreenLyric = null
                                                window._xfFullscreenLyric = null
                                            }
                                        }
                                        const openFullscreenLyric = () => {
                                            if (fullscreenLyric) {
                                                closeFullscreenLyric()
                                                return
                                            }
                                            fullscreenLyric = document.createElement('div')
                                            fullscreenLyric.className = 'xf-fullscreenLyric'
                                            fullscreenLyric.innerHTML = `<div class="xf-fullscreenLyric-dialog">
                                                <header class="xf-fullscreenLyric-header"><span>${songName.textContent || '歌词'}</span><i class="xf-fullscreenLyric-close">✕</i></header>
                                                <ul class="xf-fullscreenLyric-list"></ul>
                                            </div>`
                                            const list = fullscreenLyric.querySelector('.xf-fullscreenLyric-list')
                                            lyricsArray.forEach(lyric => {
                                                const li = document.createElement('li')
                                                li.textContent = lyric.text
                                                li.addEventListener('click', () => {
                                                    if (xfMusicAudio && xfMusicAudio.src) {
                                                        xfMusicAudio.currentTime = lyric.time
                                                        playMusic()
                                                        addPlaying()
                                                        const duration = xfMusicAudio.duration
                                                        if (duration) {
                                                            audioProgress.style.width = `${(lyric.time / duration) * 100}%`
                                                        }
                                                    }
                                                })
                                                list.appendChild(li)
                                            })
                                            fullscreenLyric.querySelector('.xf-fullscreenLyric-close').addEventListener('click', closeFullscreenLyric)
                                            fullscreenLyric.addEventListener('click', e => {
                                                if (e.target === fullscreenLyric) {
                                                    closeFullscreenLyric()
                                                }
                                            })
                                            document.body.appendChild(fullscreenLyric)
                                            window._xfFullscreenLyric = fullscreenLyric
                                        }
                                        window._xfOpenFullscreen = openFullscreenLyric
                                        xfLyric.onclick = openFullscreenLyric

                                        const updateLyricDisplay = () => {
                                            const currentTime = xfMusicAudio.currentTime
                                            const lyrics = window._xfLyricsData || []

                                            let currentLyricIndex = 0
                                            for (let j = 0; j < lyrics.length; j++) {
                                                if (currentTime >= lyrics[j].time) {
                                                    currentLyricIndex = j
                                                }
                                            }

                                            if (lyrics[currentLyricIndex]) {
                                                xfLyric.textContent = lyrics[currentLyricIndex].text
                                            }

                                            if (window._xfFullscreenLyric) {
                                                const flis = window._xfFullscreenLyric.querySelectorAll('.xf-fullscreenLyric-list li')
                                                flis.forEach(li => li.classList.remove('xf-textShow'))
                                                const cur = flis[currentLyricIndex]
                                                if (cur) {
                                                    cur.classList.add('xf-textShow')
                                                    cur.scrollIntoView({ block: 'center', behavior: 'smooth' })
                                                }
                                            }
                                        }

                                        xfMusicAudio.removeEventListener('timeupdate', updateLyricDisplay)

                                        xfMusicAudio.addEventListener('timeupdate', updateLyricDisplay)
                                    }

                                    const musicLyric = eleInExecution[0].dataset.index

                                    if (interfaceAndLocal === null) {
                                        const wyLyric = `${musicApi}/musicAll/?lyric=${musicLyric}`
                                        fetchData(wyLyric)
                                            .then(res => {
                                                if (res.code === 200) {
                                                    renderLyrics(res.lrc.lyric)
                                                }
                                            })
                                            .catch(error => console.error(`歌词获取失败：${error}`))
                                    } else {
                                        const localLyric = localSongsData[index] && localSongsData[index].lyric
                                        if (localLyric) {
                                            renderLyrics(localLyric)
                                        } else {
                                            xfAllLyri.innerHTML = ''
                                        }
                                    }
                                }
                            }

                            updateSong(currentSongIndex)

                            const prevMusic = () => {
                                isFunctionTriggered = true
                                currentSongIndex = (currentSongIndex - 1 + songsItem.length) % songsItem.length
                                updateSong(currentSongIndex)
                            }

                            const nextMusic = () => {
                                isFunctionTriggered = true
                                currentSongIndex = (currentSongIndex + 1) % songsItem.length
                                updateSong(currentSongIndex)
                            }

                            songsItem.forEach((item, index) => {
                                item.addEventListener('click', () => {
                                    isFunctionTriggered = true
                                    currentSongIndex = index
                                    updateSong(currentSongIndex)
                                })
                            })

                            nextSong.addEventListener('click', nextMusic)
                            previousSong.addEventListener('click', prevMusic)

                            window.addEventListener('keyup', e => {
                                e = event
                                if (e.key === 'ArrowRight' || e.keyCode === 39) {
                                    isFunctionTriggered = true
                                    currentSongIndex = (currentSongIndex + songsItem.length + 2) % songsItem.length
                                    updateSong(currentSongIndex)
                                }

                                if (e.key === 'ArrowLeft' || e.keyCode === 37) {
                                    prevMusic()
                                }
                            })

                            xfMusicAudio.addEventListener('timeupdate', () => {
                                const currentTime = xfMusicAudio.currentTime
                                const duration = xfMusicAudio.duration
                                const progress = (currentTime / duration) * 100

                                audioProgress.style.width = `${progress}%`

                                if (progress === 100) {
                                    nextMusic()
                                }
                            })

                            const currentMusic = () => {
                                if (musicPicture.src === "" || songName.textContent === "") {
                                    nextMusic()
                                    pauseMusic()
                                    removebePlaying()
                                    displayPopup('音乐已停止播放！')
                                }
                            }
                            currentMusic()
                            lazyLoadImages()
                        })
                    } catch (error) {
                        console.error(`发生错误：${error}`)
                    }
                }
                playBackAndForth()

                const elementDetection = setTimeout(() => {
                    const lis = [...listOfSongs.querySelectorAll('.xf-songsItem')]

                    if (lis.length === 0 || MusicPlayerMain.style.opacity === '0' || lis.length < lisNum) {
                        console.warn('检测元素渲染异常，计划重新执行中...')
                        listOfSongs.innerHTML = ''
                        playBackAndForth()
                        lazyLoadImages()
                        clearTimeout(elementDetection)
                    } else {
                        console.log('%c DOM元素渲染成功!', 'color: skyblue')
                        clearTimeout(elementDetection)
                    }
                }, 3000)

                let isSliding = false
                const startSlide = e => {
                    isSliding = true
                    slide(e)
                    playMusic()
                    addPlaying()
                }
                const slide = e => {
                    if (!isSliding) {
                        return
                    }

                    const containerRect = totalAudioProgress.getBoundingClientRect()
                    const clickX = e.clientX - containerRect.left
                    const containerWidth = containerRect.width

                    const clickProgress = (clickX / containerWidth) * 100
                    const duration = xfMusicAudio.duration
                    const newTime = (clickProgress / 100) * duration

                    xfMusicAudio.currentTime = newTime
                }

                const endSlide = () => {
                    isSliding = false
                }

                totalAudioProgress.addEventListener('mousedown', startSlide)
                totalAudioProgress.addEventListener('mousemove', slide)
                totalAudioProgress.addEventListener('mouseup', endSlide)
                totalAudioProgress.addEventListener('mouseleave', endSlide)

                playlistBtn.addEventListener('click', () => {
                    const showSong = MusicPlayer.getElementsByClassName('xf-outsideSongListShow').length
                    showSong ? outsideSongList.classList.remove('xf-outsideSongListShow') : outsideSongList.classList.add('xf-outsideSongListShow')
                })

                let throughDisplayDiv
                const goThroughShowAndLeaveHidden = () => {
                    if (!throughDisplayDiv) {
                        const throughDisplayDiv = document.createElement('div')
                        throughDisplayDiv.classList.add('xf-throughDisplay')
                        playerBody.appendChild(throughDisplayDiv)
                    }
                    const throughDisplay = document.querySelector('.xf-throughDisplay')

                    const arr = [previousSong, playbackControl, nextSong, audioFrequency, playlistBtn]

                    function handleMouseEnter(event) {
                        const mouseX = event.pageX
                        const mouseY = event.pageY

                        throughDisplay.style.left = `${mouseX + 15}px`
                        throughDisplay.style.top = `${mouseY}px`

                        switch (this) {
                            case previousSong:
                                eleShow('上一首')
                                break
                            case playbackControl:
                                eleShow('播放音乐')
                                break
                            case nextSong:
                                eleShow('下一首')
                                break
                            case audioFrequency:
                                eleShow('音量设置')
                                break
                            case playlistBtn:
                                eleShow('查看歌单')
                                break
                            default:
                                eleHidden()
                        }
                    }

                    const eleShow = text => {
                        throughDisplay.style.display = 'block'
                        throughDisplay.textContent = text
                    }

                    const eleHidden = () => throughDisplay.style.display = 'none'

                    for (let i = 0; i < arr.length; i++) {
                        const ele = arr[i]
                        ele.addEventListener('mouseenter', handleMouseEnter)
                        ele.addEventListener('mouseleave', eleHidden)
                        ele.addEventListener('click', eleHidden)
                    }
                }
                goThroughShowAndLeaveHidden()
            }
            clickControl()

            const switchPlayerFun = () => {
                const playerToggleClasses = () => {
                    switchArrow.classList.toggle('xf-jiantou1')
                    MusicPlayerMain.classList.toggle('xf-playerShow')
                }

                switchPlayer.addEventListener('click', playerToggleClasses)

                document.addEventListener('click', function (event) {
                    if (!MusicPlayer.contains(event.target)) {
                        switchArrow.classList.remove('xf-jiantou1')
                        MusicPlayerMain.classList.remove('xf-playerShow')
                    }
                })
            }

            switchPlayerFun()
            xfMusicAudio.remove()
        }
    }
    const message = '小枫博客网'
    const description = 'https://www.xfabe.com/'

    const printStyle = ['padding: 5px 10px; border-radius: 5px 0 0 5px; background-color: #8b52ec; font-weight: bold;', 'padding: 5px 10px; border-radius: 0 5px 5px 0; background-color: #a17eff; font-weight: bold;']

    console.log(`%c${message}%c${description}`, printStyle[0], printStyle[1])
})
/*gryd-force*/