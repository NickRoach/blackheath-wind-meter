const buildDisplay = () => {
    const display = document.getElementById("display");

    for(let i = 0; i < 160; i++) {
        const radius = Math.ceil(29 / 160 * i);
        let square = document.createElement("div");
        let circle = document.createElement("div");
        circle.className = "circle"
        square.style.width = "30px";
        square.style.height = "30px";
        circle.style.width = `${radius}px`;
        circle.style.height = `${radius}px`;
        circle.style.position = "relative";
        circle.style.left = `${15 - radius/2}px`;
        circle.style.top = `${15 - radius/2}px`;
        circle.style.borderRadius = "50%";
        circle.style.backgroundColor = "#444444";
        square.style.display = "inline-block";
        square.appendChild(circle);
        display.appendChild(square);
        
    }
}

document.body.onload = buildDisplay;