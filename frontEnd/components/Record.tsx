import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
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
    },
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
          size: 12,
        },
      },
    },
  },
};

type Props = {
  data: any;
  northSector: number;
  units: string;
  cf: any;
};

export const Record = ({ data, northSector, units, cf }: Props) => {
  ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

  const adjustedSectorData = [...data.sectorData];
  for (let i = 0; i < northSector; i++) {
    const lastItem = adjustedSectorData.shift();
    adjustedSectorData.push(lastItem);
  }

  const radarChartData = {
    labels: [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ],
    datasets: [
      {
        data: adjustedSectorData,
        backgroundColor: "rgba(0, 99, 132, 0.2)",
        borderColor: "rgba(0, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div
      style={{
        "display": "flex",
        "alignItems": "center",
        "flexDirection": "row",
        "justifyContent": "space-around",
        "width": "100%",
      }}
    >
      <div style={{width: "300px"}}>
        <p>{`Observation time: ${data.time}`}</p>
        <p>{`Wind speed average: ${(data.RPMAverage/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
        <p>{`Wind speed maximum: ${(data.RPMMax/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
        <p>{`Wind speed minimum: ${(data.RPMMin/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
      </div>
      <div style={{ width: "300px" }}>
        <PolarArea options={options} data={radarChartData} />
      </div>
    </div>
  );
};
