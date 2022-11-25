import React, { useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import axios from "axios";

export const DataTable = () => {
  const model = {
    "windSpeedAverage": 15,
    "windSpeedMinimum": 5,
    "windSpeedMaximum": 20,
    "windDirectionAverage": 95,
    "time": "2022-11-20T01:30:00.584Z",
  };
  const apiUrl: string =
    "https://pudmp6ay0h.execute-api.ap-southeast-2.amazonaws.com/blackheath";
  console.log(apiUrl);

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

  const [tableData, setTableData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  if (!dataLoaded) {
    getData();
  }

  console.log(tableData);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell align="center">Time</TableCell>
            <TableCell align="center">Wind Speed Average</TableCell>
            <TableCell align="center">windSpeedMinimum</TableCell>
            <TableCell align="center">windSpeedMaximum</TableCell>
            <TableCell align="center">windDirectionAverage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row: any) => (
            <TableRow
              key={row.time}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell align="center">{row.time}</TableCell>
              <TableCell align="center">{row.windSpeedAverage}</TableCell>
              <TableCell align="center">{row.windSpeedMinimum}</TableCell>
              <TableCell align="center">{row.windSpeedMaximum}</TableCell>
              <TableCell align="center">{row.windDirectionAverage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
