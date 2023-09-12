import layouts from './layouts.js'

export default class Tile {
    /**
     * Constructor
     *
     * @param {Number} position The index of the tile in the board array
     */
    constructor(position) {
        this.position = position
        this.collapsed = false
        this.facing = 'blank'
        this.layout = layouts[this.facing]
        this.neighbors = {
            north: false,
            east: false,
            south: false,
            west: false,
        }
        this.connections = {
            north: null,
            east: null,
            south: null,
            west: null,
        }
        // We have to do it this way because JavaScript defaults to passing
        // objects and arrays by reference, and we want a local copy of all
        // the possible layouts for each tile
        this.possibleTiles = (inputObj => {
            const returnObj = {}
            for (const [dir, layout] of Object.entries(inputObj)) {
                returnObj[dir] = [...layout]
            }

            return returnObj
        })(layouts)
    }

    /*
     * Getters
     */
    getLayout() {
        return this.layout
    }

    isCollapsed() {
        return this.collapsed
    }

    getEntropy() {
        return Object.values(this.possibleTiles).length
    }
    
    getConnector(direction) {
        return this.connections[direction]
    }

    /*
     * "Public" Functions
     */

    /**
     * Determine status of this Tile's neighbors
     *
     * Looks at all neighboring tiles along cardinal directions (NESW) and
     * determines whether they are collapsed (`true`), uncollapsed (`false`),
     * or out of bounds (`null`).
     *
     * @param {Array<Tile>} board The array of board tiles
     * @param {Number} width The width of the board, in tiles
     */
    findNeighbors(board, width) {
        for (const dir in this.neighbors) {
            // If the neighbor has already been determined to be out of bounds,
            // don't bother looking again
            if (this.neighbors[dir] == null) {
                continue
            }

            /*
             * Get the index we'll be checking, based on board's width. We do
             * some validation for east and west, since the board array is one-
             * dimensional. The north and south values will be validated after
             * the switch
             */
            let targetIndex = -1
            switch (dir) {
                case 'north':
                    targetIndex = this.position - width
                    break
                
                case 'east':
                    targetIndex = (this.position + 1) % width != 0 ? this.position + 1 : targetIndex
                    break;
                
                case 'south':
                    targetIndex = this.position + width
                    break

                case 'west':
                    targetIndex = (this.position - 1) % width != width - 1 ? this.position - 1 : targetIndex
                    break
            }

            // This catches both N/S indices that are out of bounds, as well as the
            // E/W ones we left at the default -1, above
            if (targetIndex >= 0 && targetIndex < board.length) {
                // All the neighbor values default to `false` in the constructor,
                // so we only have to change something if it's now collapsed
                if (board[targetIndex].isCollapsed()) {
                    this.neighbors[dir] = true
                }
            } else {
                // Marks out of bounds; should only hit this on initial board
                // generation step
                this.neighbors[dir] = null
            }
        }
    }

    /**
     * Narrows down tile possibilities for an uncollapsed tile
     *
     * Updates the Tile instance's list of possible layouts to remove
     * those with impossible connections, according to the established
     * constraints (lines must link to lines unless they're at the board's
     * edge). Throws an error if no possible tiles remain.
     *
     * @param {Array<Tile>} board The array of board tiles
     * @param {Number} width The width of the board, in tiles
     */
    findPossibleTiles(board, width) {
        for (const dir in this.neighbors) {
            // We only care if the neighbor is collapsed already
            if (this.neighbors[dir]) {
                let targetIndex
                let connector

                // Set the target index and get the connector. Since we've
                // already determined that the Tile in question is collapsed,
                // we shouldn't need to validate the index
                switch (dir) {
                    case 'north':
                        targetIndex = this.position - width
                        connector = board[targetIndex].getConnector('south')
                        break
    
                    case 'east':
                        targetIndex = this.position + 1
                        connector = board[targetIndex].getConnector('west')
                        break
    
                    case 'south':
                        targetIndex = this.position + width
                        connector = board[targetIndex].getConnector('north')
                        break
    
                    case 'west':
                        targetIndex = this.position - 1
                        connector = board[targetIndex].getConnector('east')
                        break
                }

                /*
                 * We only want to connect a side that has a single "pixel".
                 * This only really comes up if using the zig and zag layouts,
                 * which are commented out by default.
                 *
                 * We're caching it here so we don't have to check and re-check
                 * that the same connector is valid over and over again.
                 */
                const validConnector = connector.split('1').length - 1 <= 1
    
                // Loop through the possible layouts and eliminate those that don't
                // match up with the connection in the direction we're testing
                for (const [direction, layout] of Object.entries(this.possibleTiles)) {
                    let potentialConnectionStr = ''
                    let edgeArray
                    switch (dir) {
                        case 'north':
                            potentialConnectionStr = layout[0]
                            break
                            
                        case 'east':
                            edgeArray = []
                            for (let i = 0; i < 3; i++) {
                                edgeArray.push(layout[i].charAt(2))
                            }
                            potentialConnectionStr = edgeArray.join('')
                            break

                        case 'south':
                            potentialConnectionStr = layout[2]
                            break
    
                        case 'west':
                            edgeArray = []
                            for (let i = 0; i < 3; i++) {
                                edgeArray.push(layout[i].charAt(0))
                            }
                            potentialConnectionStr = edgeArray.join('')
                            break
                    }
    
                    if (validConnector && potentialConnectionStr.split('1').length - 1 <= 1 && potentialConnectionStr.localeCompare(connector) !== 0) {
                        delete this.possibleTiles[direction]
                    }
                }
            }
        }

        // If we have no possible tiles remaining
        if (!this.isCollapsed() && Object.keys(this.possibleTiles).length == 0) {
            throw new Error("No tiles possible. Please restart.")
        }
    }
    
    /**
     * Chooses a tile from the remaining possible choices.
     *
     * The choice is random from among the available options, then returns `true`. If
     * no valid choices remain, returns `false`.
     *
     * @param {Array<Tile>} board The array of board tiles
     * @param {Number} width The width of the board, in tiles
     * @returns {Boolean}
     */
    collapse(board, width) {
        const possibleLayouts = Object.keys(this.possibleTiles)
    
        if (possibleLayouts.length) {
            // Choose one at random and set appropriate values
            this.facing = possibleLayouts[Math.floor(Math.random() * possibleLayouts.length)]
            this.layout = layouts[this.facing]
            this.generateConnections()
            this.collapsed = true
            this.possibleTiles = {}

            // Tell neighbors to update their neighbor values and
            // tile possibilities
            for (const dir in this.neighbors) {
                if (this.neighbors[dir] === false) {
                    let targetIndex
                    switch (dir) {
                        case 'north':
                            targetIndex = this.position - width
                            break

                        case 'east':
                            targetIndex = this.position + 1
                            break

                        case 'south':
                            targetIndex = this.position + width
                            break

                        case 'west':
                            targetIndex = this.position - 1
                            break
                    }

                    board[targetIndex].findNeighbors(board, width)
                    board[targetIndex].findPossibleTiles(board, width)
                }
            }

            // Successfully collapsed the tile
            return true
        }
    
        // No tile layout available; tile cannot be collapsed
        return false
    }

    /**
     * Generate connection strings
     *
     * Take the given layout and generate connection strings for
     * the various directions, later to be compared to tile
     * possibilities
     */
    generateConnections() {
        for (const key in this.connections) {
            let str = ''
            const edgeArray = []
            if (this.facing == 'blank') {
                str = '000'
            } else {
                switch (key) {
                    case 'north':
                        str = this.layout[0]
                        break

                    case 'east':
                        for (let i = 0; i < this.layout.length; i++) {
                            edgeArray.push(this.layout[i].charAt(2))
                        }
                        str = edgeArray.join('')
                        break

                    // South and West maintain the same orientation as North
                    // and East, respectively, because we're going to be
                    // matching them up when we evaluate tile possibilities
                    case 'south':
                        str = this.layout[this.layout.length - 1]
                        break

                    case 'west':
                        for (let i = 0; i < this.layout.length; i++) {
                            edgeArray.push(this.layout[i].charAt(0))
                        }
                        str = edgeArray.join('')
                        break
                }
            }
            this.connections[key] = str
        }
    }
}