let allTeams
async function getTeams() {
    const response = await fetch("../_data/teams.json")
    const responseJson = await response.json()
    allTeams = responseJson
}
getTeams()

const findTeam = teamName => allTeams.find(team => team.team_name === teamName)

let previousWinningTeam, previousWinningColour
const teamNameEl = document.getElementById("team-name")
const playerNamesEl = document.getElementById("player-names")
const videoBackgroundEl = document.getElementById("video-background")
setInterval(() => {
    const currentWinningTeam = getCookie("currentWinningTeam")
    const currentWinningColour = getCookie("currentWinningColour")

    if (currentWinningTeam !== previousWinningTeam && allTeams) {
        if (previousWinningTeam === "none") {
            teamNameEl.style.display = "none"
            playerNamesEl.style.display = "none"
            return
        }

        teamNameEl.style.display = "block"
        playerNamesEl.style.display = "block"
        previousWinningTeam = currentWinningTeam
        teamNameEl.innerText = previousWinningTeam
        playerNamesEl.innerHTML = ""

        const currentTeam = findTeam(previousWinningTeam)
        if (currentTeam) {
            for (let i = 0; i < currentTeam.team_players.length; i++) {
                const playerName = document.createElement("div")
                playerName.classList.add("player-name")
                playerName.innerText = currentTeam.team_players[i]
                playerNamesEl.append(playerName)
            }
        }
    }

    if (previousWinningColour !== currentWinningColour) {
        previousWinningColour = currentWinningColour
        if (previousWinningColour === "blue") {
            videoBackgroundEl.setAttribute("src", "static/bluewin-bg.webm")
        } else {
            videoBackgroundEl.setAttribute("src", "static/greenwin-bg.webm")
        }
    }
}, 200)