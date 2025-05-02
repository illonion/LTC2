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

    for (let i = 0; i < currentFirstTo - 1; i++) {
        createTeamPickWrapper("left")
        createTeamPickWrapper("right")
    }

    function createTeamPickWrapper(side) {
        const teamPickWrapper = document.createElement("div")
        teamPickWrapper.classList.add("team-pick-wrapper")
        
        const teamPickBackgroundImage = document.createElement("div")
        teamPickBackgroundImage.classList.add("team-pick-background-image")

        const teamPickOutline = document.createElement("div")
        teamPickOutline.classList.add("team-pick-outline")

        const teamPickWinnerCrown = document.createElement("img")
        teamPickWinnerCrown.classList.add("team-pick-winner-crown")

        const teamPickModId = document.createElement("div")
        teamPickModId.classList.add("team-pick-mod-id")

        teamPickWrapper.append(teamPickBackgroundImage, teamPickOutline, teamPickWinnerCrown, teamPickModId)
        document.getElementById(`${side}-team-pick-container`).append(teamPickWrapper)
    }

    createStarDisplay()
}
getBeatmaps()

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

// Team Names
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let leftTeamName, rightTeamName

// Socket
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
}