import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Record } from "../components/Record";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, Stack } from "@mui/material";
import {
  Heading,
  HeadingContainer,
  ImageContainer,
  Label,
  SubHeading,
} from "../styles/styles";
import windCloudIcon from "../static/wind_cloud_icon.png";

const apiUrl: string =
  "https://pudmp6ay0h.execute-api.ap-southeast-2.amazonaws.com/blackheath";

const northSector = 12;

const cf = {
  "rpmToMs": 60,
  "knots": 1.94384,
  "km/h": 3.6,
  "m/s": 1,
};

export const Home = () => {
  const [tableData, setTableData] = useState<Observation[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [units, setUnits] = useState<string>("");
  const [expanded, setExpanded] = useState<string | false>("0");

  useEffect(() => {
    const savedUnits = localStorage.getItem("units");
    setUnits(savedUnits || "m/s");
  }, []);

  const getData = async () => {
    if (apiUrl) {
      await axios.get(apiUrl).then((response) => {
        if (response.status === 200 || response.statusText === "OK") {
          setTableData(response.data);
          setDataLoaded(true);
        }
      });
    } else return [];
  };

  type Observation = {
    time: string;
    RPMMax: number;
    RPMMin: number;
    RPMAverage: number;
    sectorData: number[];
  };

  const handleUnitChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!event.currentTarget) return;
    const units = event.currentTarget.value;
    localStorage.setItem("units", units);
    setUnits(units);
  };

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  if (!dataLoaded) {
    getData();
  }

  return (
    <div className={styles.container}>
      <Head>
        <meta
          name="description"
          content="Live wind observations from Mt Blackheath, NSW Australia"
        />
        <meta
          name="keywords"
          content="blue mountains, mount blackheath, live, wind, weather, forecast, paragliding, hang gliding"
        />
        <meta property="og:image" content="/static/og_image.png" />
        <link rel="shortcut icon" href="/static/favicon.ico" />
        <title>Mt Blackheath Wind</title>
      </Head>
      <main className={styles.main}>
        <Stack direction="row" spacing={1} pt={2}>
          <ImageContainer>
            <Image
              src={windCloudIcon}
              alt={"wind blowing under a fluffy cloud"}
              fill
            />
          </ImageContainer>
          <HeadingContainer>
            <Heading>Mt Blackheath Wind Observations</Heading>
          </HeadingContainer>
        </Stack>
        <SubHeading>
          Still in development. Not installed at Mt Blackheath yet! Contact
          njlroach@gmail.com
        </SubHeading>
        <Stack
          direction={"row"}
          spacing={1}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Label>Units: </Label>
          <Button
            variant={units === "m/s" ? "contained" : "outlined"}
            value={"m/s"}
            onClick={handleUnitChange}
          >
            m/s
          </Button>
          <Button
            variant={units === "knots" ? "contained" : "outlined"}
            value={"knots"}
            onClick={handleUnitChange}
          >
            knots
          </Button>
          <Button
            variant={units === "km/h" ? "contained" : "outlined"}
            value={"km/h"}
            onClick={handleUnitChange}
          >
            km/h
          </Button>
        </Stack>
        {tableData.length === 0 ? (
          <h3>Loading...</h3>
        ) : (
          tableData.map((entry, index) => (
            <Accordion
              expanded={expanded === index.toString()}
              key={index}
              onChange={handleAccordionChange(index.toString())}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
                style={{ backgroundColor: "rgba(0,0,0, 0.0)" }}
              >
                <Typography sx={{ flexShrink: 0 }}>{entry.time}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Record
                  key={index}
                  data={entry}
                  units={units}
                  cf={cf}
                  northSector={northSector}
                />
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </main>
    </div>
  );
};

export default Home;
