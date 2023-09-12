import Tile from './lib/class.tile.js'

/*
 * Setting global values
 */

// The width and height of the board, in tiles
const boardWidth = 30
const boardHeight = 30

// We'll create and populate this with resetBoard()
let boardTiles = []

// The number of tiles which have collapsed (so we know when
// we're done)
let collapsedTiles = 0

// Keeping this to track how many iterations it takes for a successful
// solution in auto mode
let iterations

// Initial setup of the board, adding event listeners to the buttons
window.onload = function() {
    // Grab the board and set the grid templates for rows and columns
    const boardDiv = document.querySelector('#board')
    boardDiv.style.gridTemplateColumns = `repeat(${boardWidth}, auto)`
    boardDiv.style.gridTemplateRows = `repeat(${boardWidth}, auto)`

    // Run the reset function, which creates a fresh board
    resetBoard()

    // Hook up the "Next" button
    document.querySelector('#nextButton').addEventListener('click', event => {
        console.log("Finding next tile...")
        // If we've collapsed all the tiles, we won't keep going
        if (collapsedTiles == boardTiles.length) {
            console.log("Done!")
        }

        doCollapse()
    })

    // Hook up the "Auto" button
    document.querySelector('#autoButton').addEventListener('click', async event => {
        console.log("Beginning auto-collapse...")
        iterations = 1
        // We loop until we either run out of tiles or run into an error
        while (collapsedTiles < boardTiles.length) {
            if (!doCollapse()) {
                console.log("No solution. Restarting...")
                iterations++
                resetBoard()
            }
            // This lets us watch the developing board, rather than having it
            // mostly just spring into being
            await new Promise(r => setTimeout(r, 20))
        }
        console.log("Done!")
        console.log(`Auto generation took ${iterations} iteration${iterations > 1 ? 's' : ''}`)
    })

    document.querySelector('#resetButton').addEventListener('click', event => {
        resetBoard()
    })
}

/**
 * Resets (or creates) the board
 *
 * Creates a fresh board array filled with new Tiles, then has those
 * tiles asses their neighbors, to find the board bounds. Finished by
 * resetting the collapsed tile counter and drawing the new, fresh
 * board.
 */
function resetBoard() {
    console.log("Creating new board...")
    // Create a fresh board
    const newBoard = new Array(boardHeight * boardWidth)

    // Create tiles at each board position
    for (let i = 0; i < newBoard.length; i++) {
        newBoard[i] = new Tile(i)
    }

    // Once all tiles are created, have them populate their neighbors
    for (let i = 0; i < newBoard.length; i++) {
        newBoard[i].findNeighbors(newBoard, boardWidth)
    }

    // Make the old board the new board and reset the collapsed tile
    // counter
    boardTiles = newBoard
    collapsedTiles = 0

    // Draw the new, fresh board
    draw()
    console.log("New board created!")
}

/**
 * Choose a single tile, collapse it, and update
 *
 * Goes through one iteration of the collapse loop and draws the new board
 * state, logging errors to the console.
 *
 * @returns {Boolean}
 */
function doCollapse() {
    let newTilePos = null
    try {
        newTilePos = iterateLoop()
    } catch (e) {
        console.error(e)
        return false
    }

    draw(newTilePos)

    return true
}

/**
 * Select a tile to collapse next
 *
 * Prefers the tile(s) with the lowest non-zero entropy (*i.e.*, the
 * smallest number of possible tiles, based on their neighbors). If
 * multiple tiles have the same entropy value, chooses one at random.
 *
 * @returns {Tile}
 */
function chooseNextTile() {
    // An array to keep track of the entropy values
    const entropyArray = new Array(boardTiles.length).fill(0)
    
    // Determine all tiles' entropy, ignoring collapsed tiles
    for (let i = 0; i < boardTiles.length; i++) {
        const currentTile = boardTiles[i]
        if (currentTile.isCollapsed()) {
            continue
        } else {
            entropyArray[i] = currentTile.getEntropy()
        }
    }
    
    // Get the lowest entropy value
    const min = Math.min(...entropyArray.filter(item => item !== 0))

    // Flags the tiles with the lowest entropy, then filters them into a separate array
    const entropicTiles = entropyArray.map((value, index) => value == min ? index : -1).filter(value => value >= 0)
    
    // If we only have one value, choose that one
    if (entropicTiles.length == 1) {
        return boardTiles[entropicTiles[0]]
    }

    // Otherwise, pick one at random
    const chosenIndex = entropicTiles[Math.floor(Math.random() * entropicTiles.length)]
    return boardTiles[chosenIndex]
}

/**
 * Selects and collapses one tile on the board
 *
 * Picks a tile and collapses it. If something goes wrong, throws an error.
 * If everything goes well, it updates that tile on the board array and
 * increments the collapsed tile counter. Returns the chosen tile's position
 * in the board array, to pass to `draw()`
 *
 * @returns {Number}
 */
function iterateLoop() {
    const nextTile = chooseNextTile()
    const success = nextTile.collapse(boardTiles, boardWidth)

    if (!success) {
        throw new Error("No possible solutions. Restart.")
    }

    boardTiles[nextTile.position] = nextTile
    collapsedTiles++
    return nextTile.position
}

/**
 * Draws the current board state
 *
 * Creates a new series of tile divs (each themselves composed of nine
 * smaller divs, like really big pixels) and updates the board div to
 * reflect the new board state.
 *
 * @param {Number} pos The index of the tile to update in the board array
 */
function draw(pos = null) {
    // Function to create the cells within a tile div
    const makeCells = (layout, container) => {
        const layoutStr = layout.join('')

        for (const char of layoutStr.split('')) {
            const newCell = document.createElement('div')
            newCell.classList.add('pixel')
            
            switch (char) {
                case '0':
                    newCell.classList.add('white')
                    break
                
                case '1':
                    newCell.classList.add('black')
                    break
            }

            container.append(newCell)
        }
    }

    // Function to create the new tile div
    const makeTile = index => {
        const id = `tile-${index}`
        const newTile = document.createElement('div')
        newTile.classList.add('tile')
        newTile.setAttribute('id', id)

        const layout = boardTiles[index].getLayout()

        const cols = layout[0].length
        const rows = layout.length

        // Setting grid templates for rows and columns
        newTile.style.gridTemplateColumns = `repeat(${cols}, auto)`
        newTile.style.gridTemplateRows = `repeat(${rows}, auto)`

        makeCells(layout, newTile)

        return newTile
    }

    // Get a reference to the board div
    const boardDiv = document.querySelector('#board')

    // If we have a position specified, only replace that tile
    // This should speed up the iteration process on bigger boards
    // by not creating hundreds of unchanged tiles over and over again
    if (pos !== null) {
        const newTile = makeTile(pos)

        // Remove the previous version of the tile
        document.querySelector(`#tile-${pos}`).remove()

        // This will work for everything but the last tile
        if (pos < boardTiles.length - 1) {
            const targetTile = document.querySelector(`#tile-${pos + 1}`)
            boardDiv.insertBefore(newTile, targetTile)
        } else {
            // If the removed tile was the last one, we can just append it
            boardDiv.append(newTile)
        }

        return
    }

    // If we're not given a position, we'll (re)draw the whole board

    const newTiles = []

    // Loop through the board array and create individual divs
    for (let i = 0; i < boardTiles.length; i++) {
        const newTile = makeTile(i)
        newTiles.push(newTile)
    }

    // Replace the children of the board div with the newly-made ones
    boardDiv.replaceChildren(...newTiles)
}