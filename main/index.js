// Get Beatmaps
const roundNameEl = document.getElementById("round-name")
let currentBestOf, currentFirstTo, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps
/**
 * Get all beatmaps from the beatmaps.json file
 * Set the round name
 * Set the ebst of and first to
 * Call create star display function
 */
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps
    roundNameEl.innerText = responseJson.roundName

    switch (responseJson.roundName) {
        case "Round of 32": case "Round of 16":
            currentBestOf = 9; break;
        case "Quarterfinals": case "Semifinals":
            currentBestOf = 11; break;
        case "Finals": case "Grand Finals":
            currentBestOf = 13; break;
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    createStarDisplay()
}
getBeatmaps()

// Find beatmap
const findBeatmapById = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === beatmapId)

// Team Stars
const leftTeamStarContainerEl = document.getElementById("left-team-star-container")
const rightTeamStarContainerEl = document.getElementById("right-team-star-container")
/**
 * Creates the star display
 */
function createStarDisplay() {
    leftTeamStarContainerEl.innerHTML = ""
    rightTeamStarContainerEl.innerHTML = ""

    let i = 0
    for (i; i < currentLeftStars; i++) createStar("green", "fill")
    for (i; i < currentFirstTo; i++) createStar("green", "empty")
    i = 0
    for (i; i < currentRightStars; i++) createStar("blue", "fill")
    for (i; i < currentFirstTo; i++) createStar("blue", "empty")


    function createStar(colour, status) {
        const wrapper = document.createElement("div")
        wrapper.classList.add("team-star-wrapper")

        let image
        if (status === "fill") {
            image = document.createElement("img")
            image.setAttribute("src", `../_shared/assets/${colour} star.png`)
        } else {
            image = document.createElement("div")
            image.classList.add("no-star", (colour === "green")? "no-left-star" : "no-right-star")
        }

        wrapper.append(image)
        if (colour === "green") leftTeamStarContainerEl.append(wrapper)
        else rightTeamStarContainerEl.append(wrapper)
    }
}

// Team Name
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let leftTeamName, rightTeamName

// Score visibility
const scoreVisibilityEl = document.getElementById("score-visible")
let scoreVisibility = true

// Score bar
const leftScoreBarEl = document.getElementById("left-score-bar")
const rightScoreBarEl = document.getElementById("right-score-bar")
// Scores
const leftScoreEl = document.getElementById("left-score")
const rightScoreEl = document.getElementById("right-score")
const leftComboScoreEl = document.getElementById("left-combo-score")
const rightComboScoreEl = document.getElementById("right-combo-score")
const leftMissScoreEl = document.getElementById("left-miss-score")
const rightMissScoreEl = document.getElementById("right-miss-score")
const animation = {
    "leftScore": new CountUp(leftScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "rightScore": new CountUp(rightScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "leftCombo": new CountUp(leftComboScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "rightCombo": new CountUp(leftComboScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "leftMiss": new CountUp(leftMissScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "rightMiss": new CountUp(rightMissScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"})
}

// Now Playing Information
const nowPlayingBackgroundImageEl = document.getElementById("now-playing-background-image")
const nowPlayingArtistTitleDifficultyEl = document.getElementById("now-playing-artist-title-difficulty")
const nowPlayingStarRatingNumberEl = document.getElementById("now-playing-star-rating-number")
const nowPlayingLengthNumberEl = document.getElementById("now-playing-length-number")
let mapId, mapChecksum, findBeatmap = false, currentMap

// Now Playing Stats
const nowPlayingStatsAr = document.getElementById("now-playing-stats-ar")
const nowPlayingStatsCs = document.getElementById("now-playing-stats-cs")
const nowPlayingStatsHp = document.getElementById("now-playing-stats-hp")
const nowPlayingStatsOd = document.getElementById("now-playing-stats-od")
const nowPlayingStatsBpm = document.getElementById("now-playing-stats-bpm")

// Check resync
let checkResync = false

// Chat Display
const chatDisplayEl = document.getElementById("chat-display")
const chatDisplayWrapperEl = document.getElementById("chat-display-wrapper")
let chatLen

// Websocket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Teams
    if (leftTeamName !== data.tourney.team.left) {
        leftTeamName = data.tourney.team.left
        leftTeamNameEl.innerText = leftTeamName
    }
    if (rightTeamName !== data.tourney.team.right) {
        rightTeamName = data.tourney.team.right
        rightTeamNameEl.innerText = rightTeamName
    }

    // Score visibility
    if (scoreVisibility !== data.tourney.scoreVisible) {
        scoreVisibility = data.tourney.scoreVisible

        if (scoreVisibility) {
            scoreVisibilityEl.style.opacity = 1
            chatDisplayEl.style.opacity = 0
        } else {
            scoreVisibilityEl.style.opacity = 0
            chatDisplayEl.style.opacity = 1
        }
    }

    // Scores
    if (scoreVisibility) {
        let currentLeftScore = 0
        let currentRightScore = 0

        // Get scores for each team
        for (let i = 0; i < data.tourney.clients.length; i++) {
            const currentPlayerPlay = data.tourney.clients[i].play
            if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "combo") {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.combo.max : currentRightScore += currentPlayerPlay.combo.max
            } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.hits["0"] : currentRightScore += currentPlayerPlay.hits["0"]
            } else {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.score : currentRightScore += currentPlayerPlay.score
            }
        }

        // Set displays
        let barWidth
        const currentScoreDelta = Math.abs(currentLeftScore - currentRightScore)
        if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "combo") {
            // Set Display
            leftScoreEl.style.opacity = 0
            rightScoreEl.style.opacity = 0
            leftComboScoreEl.style.opacity = 1
            rightComboScoreEl.style.opacity = 1
            leftMissScoreEl.style.opacity = 0
            rightMissScoreEl.style.opacity = 0
            animation.leftScore.update(0)
            animation.rightScore.update(0)
            animation.leftCombo.update(currentLeftScore)
            animation.rightCombo.update(currentRightScore)
            animation.leftMiss.update(0)
            animation.rightMiss.update(0)

            // Bar Width
            barWidth = Math.min(currentScoreDelta / 50 * 898, 898)
        } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
            // Set Display
            leftScoreEl.style.opacity = 0
            rightScoreEl.style.opacity = 0
            leftComboScoreEl.style.opacity = 0
            rightComboScoreEl.style.opacity = 0
            leftMissScoreEl.style.opacity = 1
            rightMissScoreEl.style.opacity = 1
            animation.leftScore.update(0)
            animation.rightScore.update(0)
            animation.leftCombo.update(0)
            animation.rightCombo.update(0)
            animation.leftMiss.update(currentLeftScore)
            animation.rightMiss.update(currentRightScore)

            // Bar Width
            barWidth = Math.min(currentScoreDelta / 20 * 898, 898)
        } else {
            // Set Display
            leftScoreEl.style.opacity = 1
            rightScoreEl.style.opacity = 1
            leftComboScoreEl.style.opacity = 0
            rightComboScoreEl.style.opacity = 0
            leftMissScoreEl.style.opacity = 0
            rightMissScoreEl.style.opacity = 0
            animation.leftScore.update(currentLeftScore)
            animation.rightScore.update(currentRightScore)
            animation.leftCombo.update(0)
            animation.rightCombo.update(0)
            animation.leftMiss.update(0)
            animation.rightMiss.update(0)

            // Bar Width
            barWidth = Math.min(Math.pow(currentScoreDelta / 500000, 0.5) * 898, 898)
        }

        // Score Bar - Set who is winning
        let winning = ""
        if (currentLeftScore === currentRightScore) winning = "none"
        else if ((currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss" && currentLeftScore > currentRightScore) || currentRightScore > currentLeftScore) winning = "right"
        else winning = "left"

        if (winning === "left") {
            leftScoreBarEl.style.width = `${barWidth}px`
            rightScoreBarEl.style.width = "0px"
        } else if (winning === "none") {
            leftScoreBarEl.style.width = "0px"
            rightScoreBarEl.style.width = `${barWidth}px`
        } else if (winning === "right") {
            leftScoreBarEl.style.width = "0px"
            rightScoreBarEl.style.width = "0px"
        }
    }

    // Now Playing Information
    if (mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) {

        audioElement.setAttribute("src", `http://${location.host}/Songs/${encodeURIComponent(data.directPath.beatmapAudio)}`)
        changeAudioAndPlayFromPosition(`http://${location.host}/Songs/${encodeURIComponent(data.directPath.beatmapAudio)}`, data.beatmap.time.live)

        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum
        findBeatmap = false
        checkResync = false
        
        nowPlayingBackgroundImageEl.style.backgroundImage = `url('http://${location.host}/Songs/${encodeURIComponent(data.directPath.beatmapBackground)}')`
        nowPlayingArtistTitleDifficultyEl.innerText = `${data.beatmap.artist} - ${data.beatmap.title} - [${data.beatmap.version}]`
        nowPlayingStarRatingNumberEl.innerText = data.beatmap.stats.stars.total
        displayLength(Math.round((data.beatmap.time.lastObject - data.beatmap.time.firstObject) / 1000))

        currentMap = findBeatmapById(mapId)
        if (currentMap) {
            findBeatmap = true
            let currentAr = Math.round(Number(currentMap.diff_approach) * 10) / 10
            let currentCs = Math.round(Number(currentMap.diff_size) * 10) / 10
            let currentHp = Math.round(Number(currentMap.diff_drain) * 10) / 10
            let currentOd = Math.round(Number(currentMap.diff_overall) * 10) / 10
            let currentBpm = Number(currentMap.bpm)

            switch (currentMap.mod) {
                case "HR":
                    currentCs = Math.min(Math.round(currentCs * 1.3 * 10) / 10, 10)
                    currentAr = Math.min(Math.round(currentAr * 1.4 * 10) / 10, 10)
                    currentOd = Math.min(Math.round(currentOd * 1.4 * 10) / 10, 10)
                    currentHp = Math.min(Math.round(currentHp) * 1.4 * 10 / 10, 10)
                    break
                case "DT":
                    if (currentAr > 5) currentAr = Math.round((((1200 - (( 1200 - (currentAr - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
                    else currentAr = Math.round((1800 - ((1800 - currentAr * 120) * 2 / 3)) / 120 * 10) / 10
                    currentOd = Math.round((79.5 - (( 79.5 - 6 * currentOd) * 2 / 3)) / 6 * 10) / 10
                    currentBpm = Math.round(currentBpm * 1.5)
                    currentLength = Math.round(currentLength / 1.5)
                    break
            }

            nowPlayingStatsAr.innerText = currentAr
            nowPlayingStatsCs.innerText = currentCs
            nowPlayingStatsHp.innerText = currentHp
            nowPlayingStatsOd.innerText = currentOd
            nowPlayingStatsBpm.innerText = currentBpm
        }
    } else if (audioBuffer || !audioElement.paused) {
        checkResync = true
    }

    if (!findBeatmap) {
        nowPlayingStatsAr.innerText = data.beatmap.stats.ar.converted
        nowPlayingStatsCs.innerText = data.beatmap.stats.cs.converted
        nowPlayingStatsHp.innerText = data.beatmap.stats.hp.converted
        nowPlayingStatsOd.innerText = data.beatmap.stats.od.converted
        nowPlayingStatsBpm.innerText = data.beatmap.stats.bpm.common
    }
    
    // Resume visualiser
    if (visualiserResume) {
        visualiserResume = false
        checkResync = false
        changeAudioAndPlayFromPosition(`http://${location.host}/Songs/${encodeURIComponent(data.directPath.beatmapAudio)}`, data.beatmap.time.live)
    } else {
        checkResync = true
    }

    // Resync visualiser
    if ((audioBuffer || !audioElement.paused) && checkResync) {
        syncAudioWithExternalTime(data.beatmap.time.live);
    }

    // Check for DT
    // Get mods of player 1
    let player1Mods
    if (data.tourney.clients.length > 1) player1Mods = getMods(data.tourney.clients[0].play.mods.number)
    if ((currentMap && currentMap.mod.includes("DT")) || (player1Mods && player1Mods.includes("DT"))) {
        setPlaybackSpeed(1.5)
    } else {
        setPlaybackSpeed(1)
    }

    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== data.tourney.chat.length) {
        (chatLen === 0 || chatLen > data.tourney.chat.length) ? (chatDisplayWrapperEl.innerHTML = "", chatLen = 0) : null
        const fragment = document.createDocumentFragment()

        for (let i = chatLen; i < data.tourney.chat.length; i++) {
            const chatColour = data.tourney.chat[i].team

            // Chat message container
            const chatMessageContainer = document.createElement("div")
            chatMessageContainer.classList.add("message-container")

            // Time
            const chatDisplayTime = document.createElement("div")
            chatDisplayTime.classList.add("message-time")
            chatDisplayTime.innerText = data.tourney.chat[i].timestamp

            // Whole Message
            const chatDisplayWholeMessage = document.createElement("div")
            chatDisplayWholeMessage.classList.add("message-wrapper")  

            // Name
            const chatDisplayName = document.createElement("span")
            chatDisplayName.classList.add("message-name")
            chatDisplayName.classList.add(chatColour)
            chatDisplayName.innerText = data.tourney.chat[i].name + ": ";

            // Message
            const chatDisplayMessage = document.createElement("span")
            chatDisplayMessage.classList.add("message-content")
            chatDisplayMessage.innerText = data.tourney.chat[i].message

            chatDisplayWholeMessage.append(chatDisplayName, chatDisplayMessage)
            chatMessageContainer.append(chatDisplayTime, chatDisplayWholeMessage)
            fragment.append(chatMessageContainer)
        }

        chatDisplayWrapperEl.append(fragment)
        chatLen = data.tourney.chat.length
        chatDisplayWrapperEl.scrollTop = chatDisplayWrapperEl.scrollHeight
    }
}

/**
 * Converts seconds to a mm:ss format.
 * @param {number} second - The number of seconds being displayed
 */
function displayLength(second) {
    const minutes = Math.floor(second / 60)
    const seconds = second % 60
    nowPlayingLengthNumberEl.innerText = `${minutes < 10? minutes.toString().padStart(2, "0") : minutes}:${seconds < 10? seconds.toString().padStart(2, "0") : seconds}`
}

/**
 * Start the visualiser
 */
let visualiserResume = false
function startVisualiser() {
    visualiserResume = true
}

setInterval(() => {
    // Set stars
    currentLeftStars = Number(getCookie("currentLeftStars"))
    currentRightStars = Number(getCookie("currentRightStars"))
    createStarDisplay()

    // Set current picker
    currentPicker = getCookie("currentPicker")
    setCurrentPicker(currentPicker, currentPicker === "red"? "Left" : currentPicker === "blue"? "Right" : "None")

    // Toggle Stars
    const isStarOn = getCookie("toggleStars")
    if (isStarOn === "true") {
        leftTeamStarContainerEl.style.display = "flex"
        rightTeamStarContainerEl.style.display = "flex"
    } else if (isStarOn === "false") {
        leftTeamStarContainerEl.style.display = "none"
        rightTeamStarContainerEl.style.display = "none"
    }
}, 200)

// Set current picker
const sidebarCurrentPickerEl = document.getElementById("sidebar-current-picker")
let currentPicker
function setCurrentPicker(picker, text) {
    sidebarCurrentPickerEl.innerText = text
    currentPicker = picker
    document.cookie = `currentPicker=${picker}; path=/`

    if (currentPicker === "red") barColour = "#c3ff88"
    else if (currentPicker === "blue") barColour = "#b9ddff"
    else barColour = "#cccccc"
}