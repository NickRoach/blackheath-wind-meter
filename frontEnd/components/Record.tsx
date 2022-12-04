import { Grid } from "@mui/material";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { PolarArea } from "react-chartjs-2";
import { ChartContainer, Container } from "../styles/styles";

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
    startAngle: -11.25,
      ticks: {
        display: false,
      },
      grid: {
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
    <Container>
      <Grid item xs={6} md={4}>
        <h4>Over the preceding 5 minutes:</h4>
        <p>{`Wind speed average: ${(data.RPMAverage/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
        <p>{`Wind speed maximum: ${(data.RPMMax/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
        <p>{`Wind speed minimum: ${(data.RPMMin/cf.rpmToMs * cf[units]).toFixed(1)} ${units}`}</p>
      </Grid>
      <ChartContainer>
        <PolarArea options={options} data={radarChartData} />
      </ChartContainer>
    </Container>
  );
};
