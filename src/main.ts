import "./style.css";

//make the title for the top of the screen
const title = document.createElement("h1");
title.textContent = "Sketch Pad";

//create the canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "skCanvas"; //making it easy to style

//Apending children station
document.body.appendChild(title);
document.body.appendChild(canvas);
