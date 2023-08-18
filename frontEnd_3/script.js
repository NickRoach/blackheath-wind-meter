const Units = {
    ms: 1,
    kmh: 3.6,
    knots: 1.9438,
}
let selectedUnit = Units.ms;
let axisYLabel = "m/s";

const Maxima = {
    ms: 10,
    kmh: 40,
    knots: 20,
}
let speedMaximum = Maxima.ms;

const Divisions = {
    ms: 2,
    kmh: 10,
    knots: 4,
}
let speedDivisionSize = Divisions.ms;

let selectedPack = 0;
const axisXOffset = 40;
const axisYOffset = axisXOffset;
let axisYLength;
let axisXLength;
const axisTopPadding = 70;
const axisRightPadding = 20;
const axisLabelFontSize = 14;
const axisTickWidth = 7;
const strokeWidth = 2;
const rpmToMs = 30;
const axisColor = "gray";
const circleSize = 2;
const circleColor = "cornflowerblue";
const chartBackgroundColor = "#FBFBFB";
const axisLabelColor = "black";
const activeButtonColor = "#A8C0ED";
let olderButton;
let newerButton;

const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    
let speeds = [];
let data;

const fetchData = async () => {
    const response = await fetch("https://pudmp6ay0h.execute-api.ap-southeast-2.amazonaws.com/blackheath");
    const responseJson = await response.json();
    return await responseJson;  
}

const getBinnedData = (recordPackage) => {
     let records = [];
     let stillObs = 0;
     for(let i = 0; i < recordPackage.data.length-1 ; i += 2){
        if(recordPackage.data[i+1] !== 0){
            records.push([recordPackage.data[i], recordPackage.data[i+1]])
        } else stillObs++
     }
     return {
        ...recordPackage, 
        data: records,
        stillObs 
    };
}

const convertToDirectionAndMs = (record) => {
    let correctedDirection = 0;
    let ms = 0;

    if(record[1] !== 0) {
        const convertedDirection = (record[0]/100 * 360).toFixed(0);
        const stemDirection = 280;
        correctedDirection = (convertedDirection - 14 + stemDirection + 360) % 360;

        // convert pulseDelay to microseconds
        const pulseDelay = record[1] * 200;
        const secondsPerRev = pulseDelay/1000000;
        const rpm = 60/secondsPerRev;
        ms = Math.round((rpm / rpmToMs) * 1e2) / 1e2;
    }

    return [correctedDirection, ms];
}

const getData = async () => {
    const data = await fetchData();
    const binnedData = data.map((input) => getBinnedData(input));
    const convertedData = binnedData.map(input => { 
        return {
            ...input,
            data: input.data.map(item => convertToDirectionAndMs(item))
        }
    });

    return convertedData;
}

const setUnits = (unit) => {
    switch(unit) {
        case "ms": 
            msButton.style.backgroundColor = activeButtonColor;
            kmhButton.style.backgroundColor = "white";
            knotsButton.style.backgroundColor = "white";
            selectedUnit = Units.ms;
            speedMaximum = Maxima.ms;
            speedDivisionSize = Divisions.ms;
            axisYLabel = "m/s";
            drawDataPoints();
            break;
        case "kmh":
            msButton.style.backgroundColor = "white";
            kmhButton.style.backgroundColor = activeButtonColor;
            knotsButton.style.backgroundColor = "white";
            selectedUnit = Units.kmh;
            speedMaximum = Maxima.kmh;
            speedDivisionSize = Divisions.kmh;
            axisYLabel = "km/h";
            drawDataPoints();
            break;
        case "knots":
            msButton.style.backgroundColor = "white";
            kmhButton.style.backgroundColor = "white";
            knotsButton.style.backgroundColor = activeButtonColor;
            selectedUnit = Units.knots;
            speedMaximum = Maxima.knots
            speedDivisionSize = Divisions.knots;
            axisYLabel = "knots";
            drawDataPoints();
    }
}

const changeSelectedPackage = (changeBy, data) => {
    if(changeBy === "older" && selectedPack < data.length - 1) selectedPack ++;
    if(changeBy === "newer" && selectedPack > 0) selectedPack --;
    if(selectedPack === 0) {
        newerButton.disabled = true;
    }
    else newerButton.disabled = false;
    if(selectedPack === data.length - 1) olderButton.disabled = true;
    else olderButton.disabled = false;
    drawDataPoints(data);
}

const drawDataPoints = () => {
    const recordPack = data[selectedPack];
    const chart = document.getElementById("chart");
    const ctx = chart.getContext("2d");

    // draw a filled white rectange to erase previously drawn axes and data points
    ctx.beginPath();
    ctx.fillStyle = chartBackgroundColor;
    ctx.fillRect(0, 0, chart.offsetWidth, chart.offsetHeight);
    ctx.stroke();
    
    axisYLength = chart.offsetHeight - axisTopPadding - axisYOffset;
    axisXLength = chart.offsetWidth - axisRightPadding - axisXOffset;

    // draw axes
    ctx.beginPath();
    ctx.moveTo(axisXOffset, axisTopPadding);
    ctx.lineTo(axisXOffset, chart.offsetHeight - axisYOffset);
    ctx.lineTo(chart.offsetWidth - axisRightPadding, chart.offsetHeight - axisYOffset);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    ctx.font = `${axisLabelFontSize}px Segoe UI`;
    ctx.textAlign = "center";

    // label x axis with directions and add ticks
    directions.forEach((direction, index) => {
        // add direction labels
        ctx.beginPath();
        ctx.moveTo(axisXOffset + index * axisXLength/(directions.length-1), chart.offsetHeight - axisYOffset - axisTickWidth/2);
        ctx.lineTo(axisXOffset + index * axisXLength/(directions.length-1), chart.offsetHeight - axisYOffset + axisTickWidth/2);
        ctx.stroke();
        // add ticks
        ctx.fillStyle = axisLabelColor;
        ctx.fillText(direction, axisXOffset + index * axisXLength/(directions.length - 1), chart.offsetHeight - axisYOffset/2 + axisLabelFontSize/4);
    });

    let lastSpeed = 0;
    speeds = [];
    while(lastSpeed <= speedMaximum){
        speeds.push(lastSpeed);
        lastSpeed += speedDivisionSize;
    }

    // label y axis with speeds and add ticks
    speeds.forEach((speed, index) => {
        // add speed labels
        ctx.beginPath();
        ctx.moveTo(axisXOffset - axisTickWidth/2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1));
        ctx.lineTo(axisXOffset + axisTickWidth/2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1))
        ctx.stroke();
        ctx.fillText(speed, axisXOffset/2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1) + axisLabelFontSize/4);
    });

    // label y axis with units
    ctx.font = `italic bold ${axisLabelFontSize}px Segoe UI`;
    ctx.fillText(axisYLabel, axisXOffset/2, chart.offsetHeight - axisYOffset - axisYLength + axisLabelFontSize/4 - axisTopPadding/2);

    // draw data points
    for(let x = 0; x < recordPack.data.length; x++){
        ctx.beginPath();
        ctx.fillStyle = circleColor;
        ctx.strokeStyle = circleColor;
        ctx.arc(axisXOffset + recordPack.data[x][0]/360*axisXLength, chart.offsetHeight - axisYOffset - (recordPack.data[x][1] * selectedUnit)/speedMaximum*axisYLength, circleSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    document.getElementById("percentageBox").textContent = `Still observations: ${(recordPack.stillObs / (recordPack.data.length + recordPack.stillObs) * 100).toFixed(0)}%`;
    document.getElementById("timeDisplay").textContent = `${recordPack.t}`;
}

const initialize = async () => {

    data = await getData();

    // create the chart canvas at the right size
    const chart = document.createElement('canvas');
    chart.id = "chart";
    chart.height = 370;
    chart.width = Math.min(window.innerWidth - 30, 700);
    const percentageBox = document.querySelector("#percentageBox");
    percentageBox.parentNode.insertBefore(chart, percentageBox);


    const msButton = document.getElementById("msButton");
    msButton.addEventListener("click", () => setUnits("ms"));

    const kmhButton = document.getElementById("kmhButton");
    kmhButton.addEventListener("click", () => setUnits("kmh"));

    const knotsButton = document.getElementById("knotsButton");
    knotsButton.addEventListener("click", () => setUnits("knots"));

    olderButton = document.getElementById("older");
    olderButton.addEventListener("click", () => changeSelectedPackage("older", data));

    newerButton = document.getElementById("newer");
    newerButton.disabled = true;
    newerButton.addEventListener("click", () => changeSelectedPackage("newer", data));

    drawDataPoints(data);
}

document.body.onload = initialize;