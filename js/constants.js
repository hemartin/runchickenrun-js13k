/*
 * Constants.
 * 
 * @author Martin Hentschel, @hemasail
 */

// main
var CANVAS_WIDTH  = 2;
var CANVAS_HEIGHT = 1;

// state
var RESTITUTION = 0.5; // 1 = elastic collision, <1 inelastic collision
var LATERAL_FRICTION = 1.5;
var ROTATIONAL_FRICTION = 7.5;

// font
var FONT = "px Verdena, sans-serif"; // prefix with font size
var FONT_COLOR = "#5f4808";
var TEXT_HEIGHT = 0.07;
var FONT_ALIGN_CENTER = "center";
var FONT_ALIGN_LEFT = "left";
var FONT_ALIGN_RIGHT = "right";

// score coords in upper right corner
var SCORE_X = (CANVAS_WIDTH - TEXT_HEIGHT) / 2;
var SCORE_Y = CANVAS_HEIGHT / 2 - TEXT_HEIGHT * 1.1;

// skinning
var SD = 0.018; // difference for secondary color in objects/button

// colors
var BACKGROUND = "#c4e5d2";
var CHICKEN_WHITE = "#fcf9de";

// colors from http://paletton.com/#uid=c5C1f0z2Z0kaVz84jP27qHbeJtFiHpX
var COLORS = [
    "#FD0006",
    "#FD6367",
    "#FD393E",
    "#C30005",
    "#990004",
    
    "#FF7F00",
    "#FFB163",
    "#FF9B39",
    "#C56200",
    "#9B4D00",
    
    "#00B64F",
    "#4EC883",
    "#2ABA69",
    "#008C3D",
    "#006E30",
    
    "#FFC500",
    "#FFDB63",
    "#FFD239",
    "#C59800",
    "#9B7700"
];
var LIGHT_COLORS = [
    "#FDA7A9",
    "#FEDCDD",
    "#FEC3C4",
    "#EA7F81",
    "#CD5558",
    
    "#FFD3A8",
    "#FFEEDD",
    "#FFE1C4",
    "#ECB680",
    "#CF9256",
    
    "#7DBD99",
    "#C5E4D2",
    "#A1D2B6",
    "#5BA97D",
    "#3D9363",
    
    "#FFEBA8",
    "#FFF7DD",
    "#FFF1C4",
    "#ECD380",
    "#CFB356"
];