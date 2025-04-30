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
let scoreVisibility

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
        } else {
            scoreVisibilityEl.style.opacity = 0
        }
    }

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
}