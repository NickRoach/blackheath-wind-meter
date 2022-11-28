import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
  } from "chart.js";
  import { PolarArea } from "react-chartjs-2";

 const options = {
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            enabled: false,
        }
    },
    scales: {
        r: {
            ticks: {
                display: false,
            },
          pointLabels: {
            display: true,
            centerPointLabels: true,
            font: {
              size: 12
            }
          }
        }
      },
}

  type Props = {
    data: any;
    northSector: number;
  }

export const Record = ({data, northSector}: Props) => {
    ChartJS.register(
        RadialLinearScale,
        PointElement,
        LineElement,
        Filler,
        Tooltip,
        Legend
      );

    const adjustedSectorData = [...data.sectorData];
    for(let i = 0; i < northSector; i++){
        const lastItem = adjustedSectorData.shift();
        adjustedSectorData.push(lastItem)
    }

    const radarChartData = {
        labels: ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"],
        datasets: [
          {
            data: adjustedSectorData,
            backgroundColor: "rgba(0, 99, 132, 0.2)",
            borderColor: "rgba(0, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
    };

      return <div style={{width: "500px"}}><PolarArea options={options} data={radarChartData} /></div>;
}