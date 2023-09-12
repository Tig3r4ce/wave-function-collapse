/**
 * Our tile layouts. Separated out into "lines," each `0` stands
 * for a white "pixel," while each `1` stands for a black one.
 */
export default {
    north: [
        "010",
        "111",
        "000",
    ],
    east: [
        "010",
        "011",
        "010",
    ],
    south: [
        "000",
        "111",
        "010",
    ],
    west: [
        "010",
        "110",
        "010",
    ],
    blank: [
        "000",
        "000",
        "000",
    ],
    /*
    // Extra pieces to change/complicate the output
    vertical: [
        "010",
        "010",
        "010",
    ],
    horizontal: [
        "000",
        "111",
        "000",
    ],
    zigNE: [
        "001",
        "011",
        "010",
    ],
    zigSE: [
        "010",
        "011",
        "001",
    ],
    zigSW: [
        "010",
        "110",
        "100",
    ],
    zigNW: [
        "100",
        "110",
        "010",
    ],
    zagNE: [
        "011",
        "110",
        "000",
    ],
    zagSE: [
        "000",
        "110",
        "011",
    ],
    zagSW: [
        "000",
        "011",
        "110",
    ],
    zagNW: [
        "110",
        "011",
        "000"
    ],
    */
}