
const fetchData = async () => {
    const response = await fetch("https://pudmp6ay0h.execute-api.ap-southeast-2.amazonaws.com/blackheath");
    const responseJson = await response.json();
    return await responseJson;  
}

const getBinnedData = (recordPackage) => {
     let records = [];
     for(let i = 0; i < recordPackage.data.length-1 ; i += 2){
        records.push([recordPackage.data[i], recordPackage.data[i+1]])
     }
     return {
        ...recordPackage, 
        data: records
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
            ms = Math.round((rpm / 60) * 1e2) / 1e2;
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

const buildDisplay = async () => {
    const data = await getData();

    const display = document.getElementById("display");

    console.log("data: ", data);
    data[0].data.forEach(element => {
        if(element[1] === 0) return;
        let circle = document.createElement("div");
        circle.className = "circle";
        // direction
        circle.style.left = `${display.offsetLeft + element[0] / 360 * (display.offsetWidth - display.offsetLeft - circle.offsetWidth)}px`;

        // m/s
        circle.style.top = `${display.offsetHeight - (element[1] * display.offsetHeight) - 10}px`;
        display.appendChild(circle);
        }
    )
    
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"]

    const body = document.getElementById("body");
    const directionsBox = document.createElement("div");
    body.appendChild(directionsBox);
    directionsBox.id = 'directionsBox';

    directions.forEach((direction, index) => {
        const element = document.createElement("div");
        element.textContent = direction;
        element.className = "direction";
        element.style.left = `${index * display.offsetWidth / 16}px`
        directionsBox.appendChild(element);
    })

    const numberStill = data[0].data.filter(item => item[1] === 0).length;
    const percentageStill = (numberStill / data[0].data.length) * 100;
    console.log("percentageStill: ", percentageStill.toFixed(0));

    const stillDisplay = document.createElement('div');
    stillDisplay.textContent = `Percentage still: ${percentageStill}%`;
    body.appendChild(stillDisplay);
}

document.body.onload = buildDisplay;