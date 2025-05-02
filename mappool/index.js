// Get Beatmaps
const roundNameEl = document.getElementById("round-name")
const sidebarMappoolContainerEl = document.getElementById("sidebar-mappool-container")
const preloadImagesEl = document.getElementById("preload-images")
let currentBestOf, currentFirstTo, currentLeftStars = 0, currentRightStars = 0
let allBeatmaps
/**
 * Get all beatmaps from the beatmaps.json file
 * Set the round name
 * Set the best of and first to
 * Create panels
 * Call create star display function
 * Create sidebar mappool buttons
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

    for (let i = 0; i < allBeatmaps.length; i++) {
        preloadImagesEl.setAttribute("srx", `https://assets.ppy.sh/beatmaps/${allBeatmaps[i].beatmapset_id}/covers/cover.jpg`)
        const button = document.createElement("button")
        button.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        button.setAttribute("id", allBeatmaps[i].beatmap_id)
        button.dataset.id = allBeatmaps[i].beatmap_id
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", event => event.preventDefault())
        sidebarMappoolContainerEl.append(button)
    }
}
getBeatmaps()

// Find beatmap
const findBeatmapById = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))

// Team Ban Container
const leftTeamBanContainerEl = document.getElementById("left-team-ban-container")
const rightTeamBanCotnainerEl = document.getElementById("right-team-ban-container")
// Team Pick Container
const leftTeamPickContainerEl = document.getElementById("left-team-pick-container")
const rightTeamPickContainerEl = document.getElementById("right-team-pick-container")
let currentPickTile
// Map Click Event
function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    console.log(currentMapId)
    const currentMap = findBeatmapById(currentMapId)
    console.log(currentMap)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    console.log(action, team)

    if (action === "ban") {

        const currentContainer = team === "red" ? leftTeamBanContainerEl : rightTeamBanCotnainerEl
        
        // Check container size
        if (currentContainer.childElementCount < 2) {
            const teamBanWrapper = document.createElement("div")
            teamBanWrapper.classList.add("team-ban-wrapper")

            const teamBanBackgroundImage = document.createElement("div")
            teamBanBackgroundImage.classList.add("team-ban-background-image")
            teamBanBackgroundImage.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`

            const teamBanModId = document.createElement("team-ban-mod-id")
            teamBanModId.classList.add("team-ban-mod-id")
            teamBanModId.innerText = `${currentMap.mod}${currentMap.order}`

            teamBanWrapper.append(teamBanBackgroundImage, teamBanModId)
            currentContainer.append(teamBanWrapper)
        } else {
            currentContainer.children[1].children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
            currentContainer.children[1].children[1].innerText = `${currentMap.mod}${currentMap.order}`
        }
    }

    if (action === "pick") {
        const currentContainer = team === "red" ? leftTeamPickContainerEl : rightTeamPickContainerEl

        // Get current tile
        let currentTile
        for (let i = 0; i < currentContainer.childElementCount; i++) {
            if (currentContainer.children[i].hasAttribute("data-id")) continue
            currentTile = currentContainer.children[i]
            break
        }
        if (!currentTile) return

        currentPickTile = currentTile
        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage =  `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[3].innerText = `${currentMap.mod}${currentMap.order}`

        document.cookie = `currentPicker=${team}; path=/`
    }
}

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

/**
 * Updates the star count
 * @param {string} team - Left or right side
 * @param {string} action - Plus or minus
 */
function updateStarCount(team, action) {
    if (team === "red" && action === "plus") currentLeftStars++
    else if (team === "red" && action === "minus") currentLeftStars--
    else if (team === "blue" && action === "plus") currentRightStars++
    else if (team === "blue" && action === "minus") currentRightStars--

    if (currentLeftStars > currentFirstTo) currentLeftStars = currentFirstTo
    if (currentLeftStars < 0) currentLeftStars = 0
    if (currentRightStars > currentFirstTo) currentRightStars = currentFirstTo
    if (currentRightStars < 0) currentRightStars = 0

    createStarDisplay()

    document.cookie = `currentLeftStars=${currentLeftStars}; path=/`
    document.cookie = `currentRightStars=${currentRightStars}; path=/`
}

// Team Names
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let leftTeamName, rightTeamName

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

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