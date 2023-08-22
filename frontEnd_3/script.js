// const rpmToMs = 75
const rpmToMs = 30
const stemDirection = 280

const Units = {
  ms: {
    label: 'm/s',
    multiplier: 1,
    max: 6,
    divisionSize: 1
  },
  kmh: {
    label: 'km/h',
    multiplier: 3.6,
    max: 25,
    divisionSize: 5
  },
  knots: {
    label: 'knots',
    multiplier: 1.9438,
    max: 12,
    divisionSize: 2
  }
}

let selectedUnit = Units.ms

let selectedPack = 0
const axisXOffset = 40
const axisYOffset = axisXOffset
let axisYLength
let axisXLength
const axisTopPadding = 70
const axisRightPadding = 20
const axisLabelFontSize = 14
const axisTickWidth = 7
const strokeWidth = 2
const axisColor = 'gray'
const circleSize = 2
const circleColor = '#229CFF'
const chartBackgroundColor = '#FBFBFB'
const axisLabelColor = 'black'
const activeButtonColor = '#90CDFF'

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N']

let speeds = []
let data

const fetchData = async () => {
  const response = await fetch('https://pudmp6ay0h.execute-api.ap-southeast-2.amazonaws.com/blackheath')
  const responseJson = await response.json()
  return await responseJson
}

const getBinnedData = (recordPackage) => {
  const records = []
  for (let i = 0; i < recordPackage.data.length - 1; i += 2) {
    records.push([recordPackage.data[i], recordPackage.data[i + 1]])
  }
  return {
    ...recordPackage,
    data: records
  }
}

const convertToDirectionAndMs = (record) => {
  let correctedDirection = 0
  let ms = 0

  if (record[1] !== 0) {
    const convertedDirection = (record[0] / 100 * 360).toFixed(0)
    correctedDirection = (convertedDirection - 14 + stemDirection + 360) % 360

    // convert pulseDelay to microseconds
    const pulseDelay = record[1] * 200
    const secondsPerRev = pulseDelay / 1000000
    const rpm = 60 / secondsPerRev
    ms = Math.round((rpm / rpmToMs) * 1e2) / 1e2
  }

  return [correctedDirection, ms]
}

const getData = async () => {
  const data = await fetchData()
  const binnedData = data.map((input) => getBinnedData(input))
  const convertedData = binnedData.map(input => {
    return {
      ...input,
      data: input.data.map(item => convertToDirectionAndMs(item))
    }
  })

  return convertedData
}

const setUnits = (unit, buttons) => {
  switch (unit) {
    case 'ms':
      buttons.msButton.style.backgroundColor = activeButtonColor
      buttons.kmhButton.style.backgroundColor = 'white'
      buttons.knotsButton.style.backgroundColor = 'white'
      selectedUnit = Units.ms
      localStorage.setItem('selectedUnit', 1)
      drawDataPoints()
      break
    case 'kmh':
      buttons.msButton.style.backgroundColor = 'white'
      buttons.kmhButton.style.backgroundColor = activeButtonColor
      buttons.knotsButton.style.backgroundColor = 'white'
      selectedUnit = Units.kmh
      localStorage.setItem('selectedUnit', 2)
      drawDataPoints()
      break
    case 'knots':
      buttons.msButton.style.backgroundColor = 'white'
      buttons.kmhButton.style.backgroundColor = 'white'
      buttons.knotsButton.style.backgroundColor = activeButtonColor
      selectedUnit = Units.knots
      localStorage.setItem('selectedUnit', 3)
      drawDataPoints()
  }
}

const changeSelectedPackage = (changeBy, data, olderButton, newerButton) => {
  if (changeBy === 'older' && selectedPack < data.length - 1) selectedPack++
  if (changeBy === 'newer' && selectedPack > 0) selectedPack--
  if (selectedPack === 0) {
    newerButton.disabled = true
  } else newerButton.disabled = false
  if (selectedPack === data.length - 1) olderButton.disabled = true
  else olderButton.disabled = false
  drawDataPoints(data)
}

const drawDataPoints = () => {
  const recordPack = data[selectedPack]
  const chart = document.getElementById('chart')
  const ctx = chart.getContext('2d')

  // draw a filled white rectange to erase previously drawn axes and data points
  ctx.beginPath()
  ctx.fillStyle = chartBackgroundColor
  ctx.fillRect(0, 0, chart.offsetWidth, chart.offsetHeight)
  ctx.stroke()

  axisYLength = chart.offsetHeight - axisTopPadding - axisYOffset
  axisXLength = chart.offsetWidth - axisRightPadding - axisXOffset

  // draw axes
  ctx.beginPath()
  ctx.moveTo(axisXOffset, axisTopPadding)
  ctx.lineTo(axisXOffset, chart.offsetHeight - axisYOffset)
  ctx.lineTo(chart.offsetWidth - axisRightPadding, chart.offsetHeight - axisYOffset)
  ctx.strokeStyle = axisColor
  ctx.lineWidth = strokeWidth
  ctx.stroke()

  ctx.font = `${axisLabelFontSize}px Segoe UI`
  ctx.textAlign = 'center'

  // label x axis with directions and add ticks
  directions.forEach((direction, index) => {
    // add direction labels
    ctx.beginPath()
    ctx.moveTo(axisXOffset + index * axisXLength / (directions.length - 1), chart.offsetHeight - axisYOffset - axisTickWidth / 2)
    ctx.lineTo(axisXOffset + index * axisXLength / (directions.length - 1), chart.offsetHeight - axisYOffset + axisTickWidth / 2)
    ctx.stroke()
    // add ticks
    ctx.fillStyle = axisLabelColor
    ctx.fillText(direction, axisXOffset + index * axisXLength / (directions.length - 1), chart.offsetHeight - axisYOffset / 2 + axisLabelFontSize / 4)
  })

  let lastSpeed = 0
  speeds = []
  while (lastSpeed <= selectedUnit.max) {
    speeds.push(lastSpeed)
    lastSpeed += selectedUnit.divisionSize
  }

  // label y axis with speeds and add ticks
  speeds.forEach((speed, index) => {
    // add speed labels
    ctx.beginPath()
    ctx.moveTo(axisXOffset - axisTickWidth / 2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1))
    ctx.lineTo(axisXOffset + axisTickWidth / 2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1))
    ctx.stroke()
    ctx.fillText(speed, axisXOffset / 2, chart.offsetHeight - axisYOffset - index * axisYLength / (speeds.length - 1) + axisLabelFontSize / 4)
  })

  // label y axis with units
  ctx.font = `italic bold ${axisLabelFontSize}px Segoe UI`
  ctx.fillText(selectedUnit.label, axisXOffset / 2, chart.offsetHeight - axisYOffset - axisYLength + axisLabelFontSize / 4 - axisTopPadding / 2)

  // draw data points
  let stillObs = 0
  let aboveMax = 0
  let topSpeed = 0
  for (let x = 0; x < recordPack.data.length; x++) {
    if (recordPack.data[x][1] * selectedUnit.multiplier > topSpeed) topSpeed = (recordPack.data[x][1] * selectedUnit.multiplier).toFixed(1)
    if (recordPack.data[x][1] !== 0) {
      if (recordPack.data[x][1] * selectedUnit.multiplier <= selectedUnit.max) {
        ctx.beginPath()
        ctx.fillStyle = circleColor
        ctx.strokeStyle = circleColor
        ctx.arc(axisXOffset + recordPack.data[x][0] / 360 * axisXLength, chart.offsetHeight - axisYOffset - (recordPack.data[x][1] * selectedUnit.multiplier) / selectedUnit.max * axisYLength, circleSize, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } else aboveMax++
    } else stillObs++
  }

  if (stillObs === recordPack.data.length) {
    ctx.fillText('No wind detected', chart.offsetWidth / 2, chart.offsetHeight / 2)
  }

  document.getElementById('statsBox').textContent = `Still: ${(stillObs / (recordPack.data.length) * 100).toFixed(0)}%, >${selectedUnit.max + ' ' + selectedUnit.label}: ${aboveMax}%, Max: ${topSpeed} ${selectedUnit.label}`
  document.getElementById('timeDisplay').textContent = `${recordPack.t}`
}

const drawChart = (statsBox) => {
  // create the chart canvas at the right size
  const chart = document.createElement('canvas')
  chart.id = 'chart'
  chart.height = 350
  chart.width = Math.min(window.innerWidth - 30, 500)
  statsBox.parentNode.insertBefore(chart, statsBox)
}

let width = window.innerWidth
const handleResize = () => {
  const modalBox = document.getElementById('modalBox')
  modalBox.style.height = `${document.documentElement.scrollHeight}px`
  if (width !== window.innerWidth) {
    width = window.innerWidth
    document.getElementById('chart').remove()
    drawChart(document.querySelector('#statsBox'))
    drawDataPoints(data)
  }
}

const initialize = async () => {
  data = await getData()

  const statsBox = document.querySelector('#statsBox')
  drawChart(statsBox)

  const msButton = document.getElementById('msButton')
  const kmhButton = document.getElementById('kmhButton')
  const knotsButton = document.getElementById('knotsButton')
  const buttons = {
    msButton, kmhButton, knotsButton
  }

  msButton.addEventListener('click', () => setUnits('ms', buttons))
  kmhButton.addEventListener('click', () => setUnits('kmh', buttons))
  knotsButton.addEventListener('click', () => setUnits('knots', buttons))

  const olderButton = document.getElementById('older')
  if (data.length < 2) olderButton.disabled = true

  const newerButton = document.getElementById('newer')
  newerButton.disabled = true

  olderButton.addEventListener('click', () => changeSelectedPackage('older', data, olderButton, newerButton))
  newerButton.addEventListener('click', () => changeSelectedPackage('newer', data, olderButton, newerButton))

  const storedUnit = localStorage.getItem('selectedUnit')
  switch (storedUnit) {
    case '1' :{
      msButton.style.backgroundColor = activeButtonColor
      break
    }
    case '2': {
      selectedUnit = Units.kmh
      kmhButton.style.backgroundColor = activeButtonColor
      break
    }
    case '3': {
      selectedUnit = Units.knots
      knotsButton.style.backgroundColor = activeButtonColor
      break
    }
  }

  const modalBox = document.getElementById('modalBox')
  const infoButton = document.getElementById('info')
  infoButton.addEventListener('click', () => { modalBox.style.display = 'block' })
  const closeButton = document.getElementById('close')
  closeButton.addEventListener('click', () => { modalBox.style.display = 'none' })

  modalBox.style.height = `${document.documentElement.scrollHeight}px`

  drawDataPoints(data)
}

document.body.onload = initialize
window.onresize = handleResize
