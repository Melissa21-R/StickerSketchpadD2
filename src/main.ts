import "./style.css";

//make the title for the top of the screen
const title = document.createElement("h1");
title.textContent = "Sketch Pad";
document.body.appendChild(title); //append it so it goes on screen

//create the canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "skCanvas"; //making it easy to style
document.body.appendChild(canvas); //append it so it goes on screen

//time to paint (simple marker drawing)
let isDrawing = false; //will track mouse down or upppp
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
}

//add our drawing event listeners for mouse down and up
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx?.beginPath();
  ctx?.moveTo(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx?.lineTo(x, y);
  ctx?.stroke();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx?.closePath();
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  ctx?.closePath();
});

//add the clear buttonnnnn
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
});
document.body.appendChild(clearButton); //add that button to the screen
