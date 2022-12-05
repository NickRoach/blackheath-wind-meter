import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { _DeepPartialObject } from "chart.js/types/utils";
import { PolarArea } from "react-chartjs-2";
import {
  ChartContainer,
  Container,
  ReadingHeading,
  ValuesContainer,
} from "../styles/styles";

type Props = {
  data: any;
  northSector: number;
  units: string;
  cf: any;
};

export const Record = ({ data, northSector, units, cf }: Props) => {
  ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

  let adjustedSectorData = [...data.sectorData];
  for (let i = 0; i < northSector; i++) {
    const lastItem = adjustedSectorData.shift();
    adjustedSectorData.push(lastItem);
  }
  const maxInData = Math.max(...adjustedSectorData);
  adjustedSectorData = adjustedSectorData.map(
    (datum) => (100 / maxInData) * datum
  );

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
    animation: {
      duration: 0,
    },
  };

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
        backgroundColor: "rgba(25,118,210, 0.4)",
        borderColor: "rgba(25,118,210, 0.5)",
        borderWidth: 1,
      },
      //this is to make a background circle
      {
        data: [Math.max(...adjustedSectorData)],
        backgroundColor: "rgba(150,150,150, 0.2)",
        borderWidth: 0,
      },
    ],
  };

  return (
    <Container>
      <ValuesContainer>
        <ReadingHeading>
          Wind speed over the preceding 5 minutes:
        </ReadingHeading>
        <p>{`Average: ${((data.RPMAverage / cf.rpmToMs) * cf[units]).toFixed(
          1
        )} ${units}`}</p>
        <p>{`Maximum: ${((data.RPMMax / cf.rpmToMs) * cf[units]).toFixed(
          1
        )} ${units}`}</p>
        <p>{`Minimum: ${((data.RPMMin / cf.rpmToMs) * cf[units]).toFixed(
          1
        )} ${units}`}</p>
      </ValuesContainer>
      <ChartContainer>
        <PolarArea options={options} data={radarChartData} />
      </ChartContainer>
    </Container>
  );
};
