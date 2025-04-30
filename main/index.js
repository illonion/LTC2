// Get Beatmaps
const roundNameEl = document.getElementById("round-name")
let currentBestOf, currentFirstTo, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps
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
const findBeatmapById = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmapId) === beatmapId)

// Team Stars
const leftTeamStarContainerEl = document.getElementById("left-team-star-container")
const rightTeamStarContainerEl = document.getElementById("right-team-star-container")
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
            image.setAttribute("src", `static/${colour} star.png`)
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
const animation = {
    "leftScore": new CountUp(leftScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "rightScore": new CountUp(rightScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
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

// Strains
const progressChart = document.getElementById("progress")
let tempStrains, seek, fullTime
let changeStats = false
let statsCheck = false
let last_strain_update = 0
const strainGraphEl = document.getElementById("strain-graph")
const strainGraphWidth = strainGraphEl.getBoundingClientRect().width

window.onload = function () {
	let ctx = document.getElementById('strain').getContext('2d')
	window.strainGraph = new Chart(ctx, config)

	let ctxProgress = document.getElementById('strain-progress').getContext('2d')
	window.strainGraphProgress = new Chart(ctxProgress, configProgress)
}

// Check resync
let checkResync = false

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
    // if (scoreVisibility !== data.tourney.scoreVisible) {
    //     scoreVisibility = data.tourney.scoreVisible

    //     if (scoreVisibility) {
    //         scoreVisibilityEl.style.opacity = 1
    //     } else {
    //         scoreVisibilityEl.style.opacity = 0
    //     }
    // }

    // Scores
    if (scoreVisibility) {
        let currentLeftScore = 0
        let currentRightScore = 0

        for (let i = 0; i < data.tourney.clients.length; i++) {
            data.tourney.clients[i].team === "left"? currentLeftScore += data.tourney.clients[i].play.score : currentRightScore += data.tourney.clients[i].play.score
        }

        animation.leftScore.update(currentLeftScore)
        animation.rightScore.update(currentRightScore)

        // Scorebar
        const currentScoreDelta = Math.abs(currentLeftScore - currentRightScore)
        const barWidth = Math.min(Math.pow(currentScoreDelta / 500000, 0.5) * 898, 898)
        if (currentLeftScore > currentRightScore) {
            leftScoreBarEl.style.width = `${barWidth}px`
            rightScoreBarEl.style.width = "0px"
        } else if (currentLeftScore < currentRightScore) {
            leftScoreBarEl.style.width = "0px"
            rightScoreBarEl.style.width = `${barWidth}px`
        } else if (currentLeftScore === currentRightScore) {
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

    // Strain graph
    const fullStrains = data.performance.graph.series[0].data.map((num, index) => num + data.performance.graph.series[1].data[index] + data.performance.graph.series[2].data[index] + data.performance.graph.series[3].data[index]);
    if (tempStrains != JSON.stringify(fullStrains) && window.strainGraph) {
        tempStrains = JSON.stringify(fullStrains)
        if (fullStrains) {
            let temp_strains = smooth(fullStrains, 4)
			let new_strains = []
			for (let i = 0; i < 60; i++) {
				new_strains.push(temp_strains[Math.floor(i * (temp_strains.length / 60))])
			}
			new_strains = [0, ...new_strains, 0]

			config.data.datasets[0].data = new_strains
			config.data.labels = new_strains
			config.options.scales.y.max = Math.max(...new_strains)
			configProgress.data.datasets[0].data = new_strains
			configProgress.data.labels = new_strains
			configProgress.options.scales.y.max = Math.max(...new_strains)
			window.strainGraph.update()
			window.strainGraphProgress.update()
        } else {
			config.data.datasets[0].data = []
			config.data.labels = []
			configProgress.data.datasets[0].data = []
			configProgress.data.labels = []
			window.strainGraph.update()
			window.strainGraphProgress.update()
		}
    }

    let now = Date.now()
	if (fullTime !== data.beatmap.time.mp3Length) { fullTime = data.beatmap.time.mp3Length; onepart = 463 / fullTime }
	if (seek !== data.beatmap.time.live && fullTime && now - last_strain_update > 300) {
		last_strain_update = now
		seek = data.beatmap.time.live

		if (data.state.number !== 2) {
			progressChart.style.maskPosition = `-${strainGraphWidth}px 0px`
			progressChart.style.webkitMaskPosition = `-${strainGraphWidth}px 0px`
		}
		else {
			let maskPosition = `${-1 * strainGraphWidth + onepart * seek}px 0px`
			progressChart.style.maskPosition = maskPosition
			progressChart.style.webkitMaskPosition = maskPosition
		}
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
}

// Display length
function displayLength(second) {
    const minutes = Math.floor(second / 60)
    const seconds = second % 60
    nowPlayingLengthNumberEl.innerText = `${minutes < 10? minutes.toString().padStart(2, "0") : minutes}:${seconds < 10? seconds.toString().padStart(2, "0") : seconds}`
}

// Configs are for strain graphs
let config = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			borderColor: 'rgba(245, 245, 245, 0)',
			backgroundColor: 'rgba(195, 255, 136, 0.5)',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}

let configProgress = {
	type: 'line',
	data: {
		labels: [],
		datasets: [{
			borderColor: 'rgba(245, 245, 245, 0)',
			backgroundColor: 'rgba(195, 255, 136, 1)',
			data: [],
			fill: true,
			stepped: false,
		}]
	},
	options: {
		tooltips: { enabled: false },
		legend: { display: false, },
		elements: { point: { radius: 0 } },
		responsive: false,
		scales: {
			x: { display: false, },
			y: {
				display: false,
				min: 0,
				max: 100
			}
		},
		animation: { duration: 0 }
	}
}

let visualiserResume = false
function startVisualiser() {
    visualiserResume = true
}